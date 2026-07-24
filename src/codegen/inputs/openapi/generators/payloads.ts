/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ProcessedPayloadSchemaData} from '../../asyncapi/generators/payloads';
import {pascalCase} from '../../../generators/typescript/utils';
import {onlyUnique} from '../../../utils';
import {deriveOperationId} from '../utils';
import {Logger} from '../../../../LoggingInterface';

// Constants
const JSON_SCHEMA_DRAFT_07 = 'http://json-schema.org/draft-07/schema';

/**
 * Whether a content type carries JSON: `application/json`, `text/json`, or any
 * type whose subtype ends in `+json` (e.g. `application/hal+json`). Media type
 * parameters (`; charset=...`) are ignored.
 */
function isJsonContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase().split(';')[0].trim();
  return (
    normalized === 'application/json' ||
    normalized === 'text/json' ||
    normalized.endsWith('+json')
  );
}

/**
 * Pick the schema of the best JSON content type in an OpenAPI 3.x content map,
 * preferring exact `application/json` over other JSON-family types.
 */
function pickJsonSchema(
  content: Record<string, {schema?: any}>
): any | null {
  const jsonEntries = Object.entries(content).filter(([contentType]) =>
    isJsonContentType(contentType)
  );
  if (jsonEntries.length === 0) {
    return null;
  }
  const preferred =
    jsonEntries.find(
      ([contentType]) =>
        contentType.toLowerCase().split(';')[0].trim() === 'application/json'
    ) ?? jsonEntries[0];
  return preferred[1].schema ?? null;
}

// Helper function to extract schema from OpenAPI 2.0 response
function extractOpenAPI2ResponseSchema(
  response: OpenAPIV2.ResponseObject
): any | null {
  if (response.schema) {
    return response.schema;
  }
  return null;
}

// Helper function to extract schema from OpenAPI 3.x response content
function extractOpenAPI3ResponseSchema(
  response: OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject
): any | null {
  if (!response.content) {
    return null;
  }
  return pickJsonSchema(response.content);
}

// Helper function to extract schema from OpenAPI 2.0 request body parameter
function extractOpenAPI2RequestSchema(
  parameters: OpenAPIV2.ParameterObject[]
): any | null {
  const bodyParam = parameters.find((param) => param.in === 'body') as
    | OpenAPIV2.InBodyParameterObject
    | undefined;
  return bodyParam?.schema ?? null;
}

// Helper function to extract schema from OpenAPI 3.x request body
function extractOpenAPI3RequestSchema(
  requestBody:
    | OpenAPIV3.RequestBodyObject
    | OpenAPIV3_1.RequestBodyObject
    | undefined
): any | null {
  if (!requestBody?.content) {
    return null;
  }
  return pickJsonSchema(requestBody.content);
}

// Helper function to create a union schema from multiple response schemas
function createUnionSchema(
  schemas: any[],
  baseId: string,
  hasStatusCodes: boolean = false
): any {
  if (schemas.length === 0) {
    return null;
  }

  if (schemas.length === 1) {
    const schema = schemas[0];
    return {
      ...schema,
      $id: schema.$id ?? baseId,
      $schema: JSON_SCHEMA_DRAFT_07
    };
  }

  const unionSchema: any = {
    type: 'object',
    oneOf: schemas,
    $id: baseId,
    $schema: JSON_SCHEMA_DRAFT_07
  };

  if (hasStatusCodes) {
    unionSchema['x-modelina-has-status-codes'] = true;
  }

  return unionSchema;
}

// Extract payload schemas from OpenAPI operations
function extractPayloadsFromOperations(
  paths: OpenAPIV3.PathsObject | OpenAPIV2.PathsObject | OpenAPIV3_1.PathsObject
): {
  requestPayloads: Record<string, {schema: any; schemaId: string}>;
  responsePayloads: Record<string, {schema: any; schemaId: string}>;
} {
  const requestPayloads: Record<string, {schema: any; schemaId: string}> = {};
  const responsePayloads: Record<string, {schema: any; schemaId: string}> = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem) {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object') {
        continue;
      }

      const operationObj = operation as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject;

      const operationId = deriveOperationId({
        operationId: operationObj.operationId,
        method,
        path: pathKey
      });

      // Extract request payload schema.
      // Prefer the 3.x `requestBody`: 3.x operations also carry a `parameters`
      // array (path/query/header), so presence of `parameters` cannot be used
      // to detect 2.0 - doing so would drop the body on any 3.x operation that
      // declares parameters. The 2.0 body lives in a `parameters` entry with
      // `in: 'body'`, so fall back to that only when there is no `requestBody`.
      let requestSchema: any = null;

      if ('requestBody' in operationObj && operationObj.requestBody) {
        // OpenAPI 3.x style
        const requestBody = operationObj.requestBody as
          | OpenAPIV3.RequestBodyObject
          | OpenAPIV3_1.RequestBodyObject;
        requestSchema = extractOpenAPI3RequestSchema(requestBody);
        if (
          !requestSchema &&
          requestBody.content &&
          Object.keys(requestBody.content).length > 0
        ) {
          Logger.warn(
            `OpenAPI operation '${method.toUpperCase()} ${pathKey}' request body has no JSON-compatible content type (found: ${Object.keys(requestBody.content).join(', ')}); no request payload was generated`
          );
        }
      } else if ('parameters' in operationObj && operationObj.parameters) {
        // OpenAPI 2.0 style (body carried as a `in: 'body'` parameter)
        requestSchema = extractOpenAPI2RequestSchema(
          operationObj.parameters as OpenAPIV2.ParameterObject[]
        );
      }

      if (requestSchema) {
        const requestSchemaId = pascalCase(`${operationId}_Request`);
        requestPayloads[operationId] = {
          schema: {
            ...requestSchema,
            $id: requestSchemaId,
            $schema: JSON_SCHEMA_DRAFT_07
          },
          schemaId: requestSchemaId
        };
      }

      // Extract response payload schemas
      if (operationObj.responses) {
        const responseSchemas: any[] = [];
        let hasStatusCodes = false;

        for (const [statusCode, response] of Object.entries(
          operationObj.responses
        )) {
          if (!response || typeof response !== 'object') {
            continue;
          }

          let responseSchema: any = null;

          // Determine if this is OpenAPI 2.0 or 3.x response
          if ('schema' in response) {
            // OpenAPI 2.0 style
            responseSchema = extractOpenAPI2ResponseSchema(
              response as OpenAPIV2.ResponseObject
            );
          } else {
            // OpenAPI 3.x style
            const responseObj = response as
              | OpenAPIV3.ResponseObject
              | OpenAPIV3_1.ResponseObject;
            responseSchema = extractOpenAPI3ResponseSchema(responseObj);
            if (
              !responseSchema &&
              responseObj.content &&
              Object.keys(responseObj.content).length > 0
            ) {
              Logger.warn(
                `OpenAPI operation '${method.toUpperCase()} ${pathKey}' response '${statusCode}' has no JSON-compatible content type (found: ${Object.keys(responseObj.content).join(', ')}); no response payload was generated`
              );
            }
          }

          if (responseSchema) {
            // Copy before decorating: after dereferencing the schema object is
            // shared with the component entry and every other usage site, so
            // mutating it would leak status codes across operations.
            const decoratedSchema: any = {
              ...responseSchema,
              $id: `${operationId}_Response_${statusCode}`
            };

            // Add status code information for proper discrimination
            if (statusCode !== 'default' && !isNaN(Number(statusCode))) {
              hasStatusCodes = true;
              decoratedSchema['x-modelina-status-codes'] = {
                code: Number(statusCode)
              };
            }

            responseSchemas.push(decoratedSchema);
          }
        }

        if (responseSchemas.length > 0) {
          const responseSchemaId = pascalCase(`${operationId}_Response`);
          const unionSchema = createUnionSchema(
            responseSchemas,
            responseSchemaId,
            hasStatusCodes
          );

          if (unionSchema) {
            responsePayloads[`${operationId}_Response`] = {
              schema: unionSchema,
              schemaId: responseSchemaId
            };
          }
        }
      }
    }
  }

  return {requestPayloads, responsePayloads};
}

// Helper function to extract schemas from components/definitions
function extractComponentSchemas(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): {schema: any; schemaId: string}[] {
  const componentSchemas: {schema: any; schemaId: string}[] = [];

  const pushComponentSchema = (schemaName: string, schema: unknown) => {
    if (!schema || typeof schema !== 'object') {
      return;
    }
    // Prefer the name reflected onto the schema at parse time so the
    // standalone component model and the nested models split out of
    // operation payloads (which share this exact schema object) resolve to
    // the same model name and file.
    const inferredName = (schema as Record<string, unknown>)[
      'x-modelgen-inferred-name'
    ];
    const modelName =
      typeof inferredName === 'string' ? inferredName : schemaName;
    componentSchemas.push({
      schema: {
        ...schema,
        $id: modelName,
        $schema: JSON_SCHEMA_DRAFT_07
      },
      schemaId: modelName
    });
  };

  // OpenAPI 3.x components
  if ('components' in openapiDocument && openapiDocument.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(
      openapiDocument.components.schemas
    )) {
      pushComponentSchema(schemaName, schema);
    }
  }

  // OpenAPI 2.0 definitions
  if ('definitions' in openapiDocument && openapiDocument.definitions) {
    for (const [schemaName, schema] of Object.entries(
      openapiDocument.definitions
    )) {
      pushComponentSchema(schemaName, schema);
    }
  }

  return componentSchemas;
}

// OpenAPI input processor
export function processOpenAPIPayloads(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): ProcessedPayloadSchemaData {
  const channelPayloads: Record<string, {schema: any; schemaId: string}> = {};
  const operationPayloads: Record<string, {schema: any; schemaId: string}> = {};
  const otherPayloads: {schema: any; schemaId: string}[] = [];

  // Extract request and response payloads from operations
  const {requestPayloads, responsePayloads} = extractPayloadsFromOperations(
    openapiDocument.paths ?? {}
  );

  // Map request payloads to operation payloads
  for (const [operationId, payload] of Object.entries(requestPayloads)) {
    operationPayloads[operationId] = payload;
  }

  // Map response payloads to operation payloads
  for (const [responseId, payload] of Object.entries(responsePayloads)) {
    operationPayloads[responseId] = payload;
  }

  // Extract component schemas
  const componentSchemas = extractComponentSchemas(openapiDocument);
  otherPayloads.push(...componentSchemas);

  // Webhooks (OpenAPI 3.1) are not traversed; warn once so their omission is
  // visible rather than silent.
  const webhooks = (openapiDocument as {webhooks?: Record<string, unknown>})
    .webhooks;
  if (webhooks && Object.keys(webhooks).length > 0) {
    Logger.warn(
      'OpenAPI webhooks are not supported and were ignored; no code was generated for them.'
    );
  }

  return {
    channelPayloads,
    operationPayloads,
    otherPayloads: onlyUnique(otherPayloads)
  };
}
