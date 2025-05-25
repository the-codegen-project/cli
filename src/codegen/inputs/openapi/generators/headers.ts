/* eslint-disable security/detect-object-injection */
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { ProcessedHeadersData } from "../../../generators/typescript/headers";
import { pascalCase } from "../../../generators/typescript/utils";

// Helper function to convert OpenAPI parameter schema to JSON Schema
function convertParameterSchemaToJsonSchema(parameter: any): any {
  let schema: any;
  
  if (parameter.schema) {
    // OpenAPI 3.x format
    schema = { ...parameter.schema };
  } else if (parameter.type) {
    // OpenAPI 2.x format
    schema = {
      type: parameter.type,
      ...(parameter.format && { format: parameter.format }),
      ...(parameter.enum && { enum: parameter.enum }),
      ...(parameter.minimum !== undefined && { minimum: parameter.minimum }),
      ...(parameter.maximum !== undefined && { maximum: parameter.maximum }),
      ...(parameter.minLength !== undefined && { minLength: parameter.minLength }),
      ...(parameter.maxLength !== undefined && { maxLength: parameter.maxLength }),
      ...(parameter.pattern && { pattern: parameter.pattern }),
    };
  } else {
    // Fallback to string type
    schema = { type: 'string' };
  }

  return schema;
}

// Extract header parameters from OpenAPI operations
function extractHeadersFromOperations(paths: OpenAPIV3.PathsObject | OpenAPIV2.PathsObject | OpenAPIV3_1.PathsObject): Record<string, any[]> {
  const operationHeaders: Record<string, any[]> = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      const operationObj = operation as OpenAPIV3.OperationObject | OpenAPIV2.OperationObject | OpenAPIV3_1.OperationObject;
      // Collect header parameters from operation and path-level
      const allParameters = operationObj.parameters ?? [];

      const headerParams = allParameters.filter((param: any) => {
        return param.in === 'header';
      });

      if (allParameters.length > 0) {
        const operationId = operationObj.operationId ?? `${method}${pathKey.replace(/[^a-zA-Z0-9]/g, '')}`;  
        operationHeaders[operationId] = headerParams;
      }
    }
  }

  return operationHeaders;
}

// OpenAPI input processor
export function processOpenAPIHeaders(
  openapiDocument: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document
): ProcessedHeadersData {
  const channelHeaders: Record<string, {
    schema: any;
    schemaId: string;
  } | undefined> = {};

  // Extract header parameters from all operations
  const operationHeaders = extractHeadersFromOperations(openapiDocument.paths ?? {});

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
      const paramSchema = convertParameterSchemaToJsonSchema(param);
      
      // Add description if available
      if (param.description) {
        paramSchema.description = param.description;
      }

      properties[paramName] = paramSchema;

      // Check if parameter is required
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

  return { channelHeaders };
}
