/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ProcessedHeadersData} from '../../../generators/typescript/headers';
import {
  defaultCodegenTypescriptModelinaOptions,
  pascalCase
} from '../../../generators/typescript/utils';
import {
  collectOperationParameters,
  deriveOperationId,
  isHttpMethod
} from '../utils';
import {
  ConstrainedArrayModel,
  ConstrainedBooleanModel,
  ConstrainedFloatModel,
  ConstrainedIntegerModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
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

/**
 * A header is always text on the wire, so the deserializer has to invert the
 * serializer's `String(...)` per property type. The decision is made on the
 * constrained model itself (never a string match on `type`); a reference model
 * — an enum, for instance — is unwrapped so the model it points at decides.
 */
type HeaderWireKind = 'number' | 'boolean' | 'array' | 'text';

function resolveHeaderWireKind(property: ConstrainedMetaModel): HeaderWireKind {
  const model =
    property instanceof ConstrainedReferenceModel ? property.ref : property;
  if (
    model instanceof ConstrainedIntegerModel ||
    model instanceof ConstrainedFloatModel
  ) {
    return 'number';
  }
  if (model instanceof ConstrainedBooleanModel) {
    return 'boolean';
  }
  if (model instanceof ConstrainedArrayModel) {
    return 'array';
  }
  // Strings, enums and unions all arrive as text and are cast to the declared
  // property type.
  return 'text';
}

function renderHeaderSerializer(model: ConstrainedObjectModel): string {
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

function renderHeaderPropertyDeserialization({
  modelName,
  tsName,
  lookupName,
  kind
}: {
  modelName: string;
  tsName: string;
  lookupName: string;
  kind: HeaderWireKind;
}): string {
  const valueVariable = `${tsName}Value`;
  if (kind === 'array') {
    return `  const ${valueVariable} = readHeaderList('${lookupName}');
  if (${valueVariable} !== undefined) { result.${tsName} = ${valueVariable} as ${modelName}['${tsName}']; }`;
  }
  if (kind === 'number') {
    return `  const ${valueVariable} = readHeader('${lookupName}');
  if (${valueVariable} !== undefined) {
    const ${tsName}Number = Number(${valueVariable});
    if (!Number.isNaN(${tsName}Number)) { result.${tsName} = ${tsName}Number; }
  }`;
  }
  if (kind === 'boolean') {
    return `  const ${valueVariable} = readHeader('${lookupName}');
  if (${valueVariable} !== undefined) { result.${tsName} = ${valueVariable} === 'true'; }`;
  }
  return `  const ${valueVariable} = readHeader('${lookupName}');
  if (${valueVariable} !== undefined) { result.${tsName} = ${valueVariable} as ${modelName}['${tsName}']; }`;
}

function renderHeaderDeserializer(model: ConstrainedObjectModel): string {
  const modelName = model.name;
  const signature = `export function deserialize${modelName}Headers(headers: Record<string, string | string[] | undefined>): ${modelName}`;
  const properties = Object.values(model.properties).map((prop) => ({
    tsName: prop.propertyName,
    // Header names are case-insensitive on the wire and Node lower-cases the
    // inbound ones, so everything is matched against a lower-cased view.
    lookupName: prop.unconstrainedPropertyName.toLowerCase(),
    kind: resolveHeaderWireKind(prop.property)
  }));

  if (properties.length === 0) {
    return `${signature} {
  return {} as ${modelName};
}`;
  }

  const readHeader = properties.some((prop) => prop.kind !== 'array')
    ? `  const readHeader = (name: string): string | undefined => {
    const value = normalized[name];
    if (value === undefined) { return undefined; }
    return Array.isArray(value) ? value[0] : value;
  };
`
    : '';
  const readHeaderList = properties.some((prop) => prop.kind === 'array')
    ? `  const readHeaderList = (name: string): string[] | undefined => {
    const value = normalized[name];
    if (value === undefined) { return undefined; }
    // \`serialize${modelName}Headers\` comma-joins arrays through String(...),
    // so one value can carry several entries.
    return Array.isArray(value) ? value : String(value).split(',');
  };
`
    : '';
  const assignments = properties
    .map((prop) => renderHeaderPropertyDeserialization({modelName, ...prop}))
    .join('\n');

  return `${signature} {
  // Header names are case-insensitive on the wire, so match on a lower-cased
  // view of whatever arrived (Express hands over lower-cased names already).
  const normalized: Record<string, string | string[] | undefined> = {};
  for (const [name, value] of Object.entries(headers)) {
    normalized[name.toLowerCase()] = value;
  }
${readHeader}${readHeaderList}  // Built up property by property; an absent header leaves its property absent
  // rather than assigning undefined, so required properties stay required.
  const result = {} as ${modelName};
${assignments}
  return result;
}`;
}

/**
 * Emits both directions for an OpenAPI header model: `serialize<Model>Headers`
 * for outbound requests (the HTTP client) and `deserialize<Model>Headers` for
 * inbound ones (the HTTP server). OpenAPI header models are interfaces, so both
 * are free functions rather than methods.
 */
export function generateOpenAPIHeaderFunctions(
  model: ConstrainedObjectModel
): string {
  return `${renderHeaderSerializer(model)}

${renderHeaderDeserializer(model)}`;
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
      if (!isHttpMethod(method)) {
        continue;
      }

      const operationObj = operation as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject;
      // Collect header parameters from operation and path-level
      const allParameters = collectOperationParameters({
        pathItem,
        operation: operationObj
      });

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
