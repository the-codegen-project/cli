/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ProcessedHeadersData} from '../../../generators/typescript/headers';
import {
  defaultCodegenTypescriptModelinaOptions,
  pascalCase
} from '../../../generators/typescript/utils';
import {deriveOperationId} from '../utils';
import {
  ConstrainedObjectModel,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';

export function createOpenAPIHeadersGenerator() {
  return new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    modelType: 'interface',
    presets: [TS_DESCRIPTION_PRESET]
  });
}

export function generateOpenAPIHeaderFunctions(
  model: ConstrainedObjectModel
): string {
  const modelName = model.name;

  const headerMappings = Object.values(model.properties)
    .map((prop) => {
      const wireName = prop.unconstrainedPropertyName;
      const tsName = prop.propertyName;
      return `  if (headers.${tsName} !== undefined) { result['${wireName}'] = String(headers.${tsName}); }`;
    })
    .join('\n');

  return `export function serialize${modelName}Headers(headers: ${modelName}): Record<string, string> {
  const result: Record<string, string> = {};
${headerMappings}
  return result;
}`;
}

// Helper function to convert OpenAPI header schema to JSON Schema
function convertHeaderSchemaToJsonSchema(header: any): any {
  let schema: any;

  if (header.schema) {
    // OpenAPI 3.x format
    schema = {...header.schema};
  } else if (header.type) {
    // OpenAPI 2.x format
    schema = {
      type: header.type,
      ...(header.format && {format: header.format}),
      ...(header.enum && {enum: header.enum}),
      ...(header.minimum !== undefined && {minimum: header.minimum}),
      ...(header.maximum !== undefined && {maximum: header.maximum}),
      ...(header.minLength !== undefined && {
        minLength: header.minLength
      }),
      ...(header.maxLength !== undefined && {
        maxLength: header.maxLength
      }),
      ...(header.pattern && {pattern: header.pattern})
    };
  } else {
    // Fallback to string type
    schema = {type: 'string'};
  }

  return schema;
}

// Extract header parameters from OpenAPI operations
function extractHeadersFromOperations(
  paths: OpenAPIV3.PathsObject | OpenAPIV2.PathsObject | OpenAPIV3_1.PathsObject
): Record<string, any[]> {
  const operationHeaders: Record<string, any[]> = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      const operationObj = operation as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject;
      // Collect header parameters from operation and path-level
      const allParameters = operationObj.parameters ?? [];

      const headerParams = allParameters.filter((param: any) => {
        return param.in === 'header';
      });

      if (headerParams.length > 0) {
        const operationId = deriveOperationId({
          operationId: operationObj.operationId,
          method,
          path: pathKey
        });
        operationHeaders[operationId] = headerParams;
      }
    }
  }

  return operationHeaders;
}

// OpenAPI input processor
export function processOpenAPIHeaders(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): ProcessedHeadersData {
  const channelHeaders: Record<
    string,
    | {
        schema: any;
        schemaId: string;
      }
    | undefined
  > = {};

  // Extract header parameters from all operations
  const operationHeaders = extractHeadersFromOperations(
    openapiDocument.paths ?? {}
  );

  // Process each operation that has header parameters
  for (const [operationId, headerParams] of Object.entries(operationHeaders)) {
    if (headerParams.length === 0) {
      channelHeaders[operationId] = undefined;
      continue;
    }

    // Create a JSON Schema object for the headers
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of headerParams) {
      const paramName = param.name;
      const paramSchema = convertHeaderSchemaToJsonSchema(param);

      // Add description if available
      if (param.description) {
        paramSchema.description = param.description;
      }

      properties[paramName] = paramSchema;

      // Check if header is required
      if (param.required === true) {
        required.push(paramName);
      }
    }

    // Create the complete schema object
    const schemaObj: any = {
      type: 'object',
      additionalProperties: false,
      properties,
      $id: pascalCase(`${operationId}_headers`),
      $schema: 'http://json-schema.org/draft-07/schema'
    };

    // Add required array if there are required parameters
    if (required.length > 0) {
      schemaObj.required = required;
    }

    channelHeaders[operationId] = {
      schema: schemaObj,
      schemaId: pascalCase(`${operationId}_headers`)
    };
  }

  return {channelHeaders};
}
