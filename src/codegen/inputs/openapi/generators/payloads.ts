/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ProcessedPayloadSchemaData} from '../../asyncapi/generators/payloads';
import {pascalCase} from '../../../generators/typescript/utils';
import {onlyUnique} from '../../../utils';

// Constants
const JSON_SCHEMA_DRAFT_07 = 'http://json-schema.org/draft-07/schema';

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

  // Prioritize JSON content types
  const jsonContentTypes = [
    'application/json',
    'application/vnd.api+json',
    'text/json'
  ];

  // Fall back to any content type with a schema
  for (const [contentType, mediaType] of Object.entries(response.content)) {
    if (!jsonContentTypes.includes(contentType)) {
      continue;
    }
    if (mediaType.schema) {
      return mediaType.schema;
    }
  }

  return null;
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

  // Prioritize JSON content types
  const jsonContentTypes = [
    'application/json',
    'application/vnd.api+json',
    'text/json'
  ];

  // Fall back to any content type with a schema
  for (const [contentType, mediaType] of Object.entries(requestBody.content)) {
    if (!jsonContentTypes.includes(contentType)) {
      continue;
    }
    if (mediaType.schema) {
      return mediaType.schema;
    }
  }

  return null;
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

      const operationId =
        operationObj.operationId ??
        `${method}${pathKey.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Extract request payload schema
      let requestSchema: any = null;

      // Check if this is OpenAPI 2.0 vs 3.x based on the structure
      if ('parameters' in operationObj && operationObj.parameters) {
        // OpenAPI 2.0 style
        requestSchema = extractOpenAPI2RequestSchema(
          operationObj.parameters as OpenAPIV2.ParameterObject[]
        );
      } else if ('requestBody' in operationObj && operationObj.requestBody) {
        // OpenAPI 3.x style
        requestSchema = extractOpenAPI3RequestSchema(
          operationObj.requestBody as
            | OpenAPIV3.RequestBodyObject
            | OpenAPIV3_1.RequestBodyObject
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
            responseSchema = extractOpenAPI3ResponseSchema(
              response as OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject
            );
          }

          if (responseSchema) {
            // Add status code information for proper discrimination
            if (statusCode !== 'default' && !isNaN(Number(statusCode))) {
              hasStatusCodes = true;
              responseSchema['x-modelina-status-codes'] = {
                code: Number(statusCode)
              };
            }

            responseSchemas.push({
              ...responseSchema,
              $id: `${operationId}_Response_${statusCode}`
            });
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

  // OpenAPI 3.x components
  if ('components' in openapiDocument && openapiDocument.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(
      openapiDocument.components.schemas
    )) {
      if (schema && typeof schema === 'object') {
        componentSchemas.push({
          schema: {
            ...schema,
            $id: schemaName,
            $schema: JSON_SCHEMA_DRAFT_07
          },
          schemaId: schemaName
        });
      }
    }
  }

  // OpenAPI 2.0 definitions
  if ('definitions' in openapiDocument && openapiDocument.definitions) {
    for (const [schemaName, schema] of Object.entries(
      openapiDocument.definitions
    )) {
      if (schema && typeof schema === 'object') {
        componentSchemas.push({
          schema: {
            ...schema,
            $id: schemaName,
            $schema: JSON_SCHEMA_DRAFT_07
          },
          schemaId: schemaName
        });
      }
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

  return {
    channelPayloads,
    operationPayloads,
    otherPayloads: onlyUnique(otherPayloads)
  };
}
