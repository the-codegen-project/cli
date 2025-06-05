/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {defaultCodegenTypescriptModelinaOptions, pascalCase} from '../../../generators/typescript/utils';
import {ProcessedParameterSchemaData} from '../../asyncapi/generators/parameters';
import { ConstrainedObjectModel, TS_DESCRIPTION_PRESET, TypeScriptFileGenerator } from '@asyncapi/modelina';

// Constants for OpenAPI parameter metadata keys
const X_PARAMETER_LOCATION = 'x-parameter-location';
const X_PARAMETER_STYLE = 'x-parameter-style';
const X_PARAMETER_EXPLODE = 'x-parameter-explode';
const X_PARAMETER_ALLOW_RESERVED = 'x-parameter-allowReserved';
const X_PARAMETER_COLLECTION_FORMAT = 'x-parameter-collectionFormat';

// OpenAPI parameter processor
export function processOpenAPIParameters(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): ProcessedParameterSchemaData {
  const channelParameters: Record<string, {schema: any; schemaId: string}> = {};

  for (const [pathKey, pathItem] of Object.entries(openapiDocument.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      const operationObj = operation as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject;
      
      // Collect parameters from operation and path-level
      const allParameters = operationObj.parameters ?? [];

      const filteredParams = allParameters.filter((param: any) => {
        return ['path', 'query'].includes(param.in);
      });

      if (filteredParams.length > 0) {
        const operationId =
          operationObj.operationId ??
          `${method}${pathKey.replace(/[^a-zA-Z0-9]/g, '')}`;
        // Create schema for the parameters
        const parameterSchema = createParameterSchema(
          operationId,
          filteredParams,
          'Parameters',
          pathKey
        );
    
        channelParameters[operationId] = {
          schema: parameterSchema.schema,
          schemaId: parameterSchema.schemaId
        };
      }
    }
  }

  return {
    channelParameters
  };
} 

// Helper function to convert OpenAPI parameter schema to JSON Schema
export function convertParameterSchemaToJsonSchema(parameter: any): any {
  let schema: any;

  if (parameter.schema) {
    // OpenAPI 3.x format
    schema = {...parameter.schema};
  } else if (parameter.type) {
    // OpenAPI 2.x format
    schema = {
      type: parameter.type,
      ...(parameter.format && {format: parameter.format}),
      ...(parameter.enum && {enum: parameter.enum}),
      ...(parameter.minimum !== undefined && {minimum: parameter.minimum}),
      ...(parameter.maximum !== undefined && {maximum: parameter.maximum}),
      ...(parameter.minLength !== undefined && {
        minLength: parameter.minLength
      }),
      ...(parameter.maxLength !== undefined && {
        maxLength: parameter.maxLength
      }),
      ...(parameter.pattern && {pattern: parameter.pattern})
    };
  } else {
    // Fallback to string type
    schema = {type: 'string'};
  }

  return schema;
}

// Create JSON Schema object from parameters
// eslint-disable-next-line sonarjs/cognitive-complexity
export function createParameterSchema(
  operationId: string,
  parameters: any[],
  schemaIdSuffix: string,
  path?: string
): {schema: any; schemaId: string} {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of parameters) {
    const paramName = param.name;
    const paramSchema = convertParameterSchemaToJsonSchema(param);

    // Add description if available
    if (param.description) {
      paramSchema.description = param.description;
    }
    // Add parameter location metadata to each individual property
    if (param.in) {
      paramSchema[X_PARAMETER_LOCATION] = param.in;
    }
    if (param.style) {
      paramSchema[X_PARAMETER_STYLE] = param.style;
    }
    if (param.explode) {
      paramSchema[X_PARAMETER_EXPLODE] = param.explode;
    }
    if (param.allowReserved) {
      paramSchema[X_PARAMETER_ALLOW_RESERVED] = param.allowReserved;
    }
    
    // Handle OpenAPI 2.0 collectionFormat for backward compatibility
    if (param.collectionFormat) {
      paramSchema[X_PARAMETER_COLLECTION_FORMAT] = param.collectionFormat;
    }

    properties[paramName] = paramSchema;

    // Check if parameter is required
    if (param.required === true) {
      required.push(paramName);
    }
  }

  const schemaId = pascalCase(`${operationId}_${schemaIdSuffix.toLowerCase()}`);
  
  // Create the complete schema object
  const schemaObj: any = {
    type: 'object',
    additionalProperties: false,
    properties,
    $id: schemaId,
    $schema: 'http://json-schema.org/draft-07/schema',
    'x-channel-address': path
  };

  // Add required array if there are required parameters
  if (required.length > 0) {
    schemaObj.required = required;
  }

  return {
    schema: schemaObj,
    schemaId
  };
}

/**
 * Generate additional content for OpenAPI parameter classes
 */
function generateOpenAPIParameterMethods(model: ConstrainedObjectModel) {
  const properties = model.originalInput?.properties ?? {};
  
  // Collect path and query parameters
  const pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}> = [];
  const queryParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}> = [];
  
  for (const [propName, propSchema] of Object.entries(properties)) {
    const paramConfig = processParameterSchema(propName, propSchema);
    if (paramConfig) {
      if (paramConfig.location === 'path') {
        pathParams.push(paramConfig);
      } else if (paramConfig.location === 'query') {
        queryParams.push(paramConfig);
      }
    }
  }
  
  if (pathParams.length === 0 && queryParams.length === 0) {
    return '';
  }

  // Generate both serialization and deserialization methods
  const serializationMethods = generateSerializationMethods(pathParams, queryParams);
  const deserializationMethods = generateDeserializationMethods(pathParams, queryParams, model);
  const extractPathParametersMethod = pathParams.length > 0 ? generateExtractPathParametersMethod(pathParams, model) : '';
  
  return `${serializationMethods}${deserializationMethods}${extractPathParametersMethod}`;
}

/**
 * Process a parameter schema and return configuration for serialization
 */
function processParameterSchema(propName: string, propSchema: any): {name: string, location: string, style: string, explode: boolean, allowReserved: boolean} | null {
  const schema = propSchema;
  const location = schema[X_PARAMETER_LOCATION];
  
  if (!location || !['path', 'query'].includes(location)) {
    return null;
  }
  
  // Handle OpenAPI 2.0 collectionFormat for backward compatibility
  let style = schema[X_PARAMETER_STYLE];
  let explode = schema[X_PARAMETER_EXPLODE];
  
  if (schema[X_PARAMETER_COLLECTION_FORMAT]) {
    // Convert OpenAPI 2.0 collectionFormat to OpenAPI 3.0 style/explode
    const converted = convertCollectionFormatToStyleAndExplode(schema[X_PARAMETER_COLLECTION_FORMAT], location);
    style = style ?? converted.style;
    explode = explode !== undefined ? explode : converted.explode;
  } else {
    // Use default values for OpenAPI 3.0+
    style = style ?? (location === 'path' ? 'simple' : 'form');
    explode = explode !== undefined ? explode : (location === 'query');
  }
  
  const allowReserved = schema[X_PARAMETER_ALLOW_RESERVED] ?? false;
  
  return {
    name: propName,
    location,
    style,
    explode,
    allowReserved
  };
}

/**
 * Generate all serialization methods
 */
function generateSerializationMethods(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, queryParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>): string {
  let methods = '';
  
  // Generate path parameter serialization method
  if (pathParams.length > 0) {
    methods += generatePathSerializationMethod(pathParams);
  }
  
  // Generate query parameter serialization method
  if (queryParams.length > 0) {
    methods += generateQuerySerializationMethod(queryParams);
  }
  
  // Generate combined serialization method
  methods += generateUrlSerializationMethod(pathParams.length > 0, queryParams.length > 0);
  
  return methods;
}

/**
 * Generate path parameter serialization method
 */
function generatePathSerializationMethod(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>): string {
  const paramSerializations = pathParams.map(param => generatePathParameterSerialization(param)).join('\n');
  
  return `
/**
 * Serialize path parameters according to OpenAPI 2.0/3.x specification
 * @returns Record of parameter names to their serialized values for path substitution
 */
serializePathParameters(): Record<string, string> {
  const result: Record<string, string> = {};
  
${paramSerializations}
  
  return result;
}`;
}

/**
 * Generate query parameter serialization method
 */
function generateQuerySerializationMethod(queryParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>): string {
  const paramSerializations = queryParams.map(param => generateQueryParameterSerialization(param)).join('\n');
  
  return `
/**
 * Serialize query parameters according to OpenAPI 2.0/3.x specification
 * @returns URLSearchParams object with serialized query parameters
 */
serializeQueryParameters(): URLSearchParams {
  const params = new URLSearchParams();
  
${paramSerializations}
  
  return params;
}`;
}

/**
 * Generate URL serialization method
 */
function generateUrlSerializationMethod(hasPathParams: boolean, hasQueryParams: boolean): string {
  const pathLogic = hasPathParams ? `
  const pathParams = this.serializePathParameters();
  for (const [name, value] of Object.entries(pathParams)) {
    url = url.replace(new RegExp(\`{\${name}}\`, 'g'), value);
  }` : '';
    
  const queryLogic = hasQueryParams ? `
  const queryParams = this.serializeQueryParameters();
  const queryString = queryParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }` : '';

  return `
/**
 * Get the complete serialized URL with path and query parameters
 * @param basePath The base path template (e.g., '/users/{id}')
 * @returns The complete URL with serialized parameters
 */
serializeUrl(basePath: string): string {
  let url = basePath;
  
  // Replace path parameters
  ${pathLogic}
  
  // Add query parameters
  ${queryLogic}
  
  return url;
}`;
}

/**
 * Generate serialization code for a single path parameter
 */
function generatePathParameterSerialization(param: {name: string, style: string, explode: boolean, allowReserved: boolean}): string {
  const {name, style, explode, allowReserved} = param;
  const encoding = allowReserved ? '' : 'encodeURIComponent';
  
  return `    // Serialize path parameter: ${name} (style: ${style}, explode: ${explode})
  if (this.${name} !== undefined && this.${name} !== null) {
    const value = this.${name};
    ${generatePathSerializationLogic(name, style, explode, encoding)}
  }`;
}

/**
 * Generate serialization code for a single query parameter
 */
function generateQueryParameterSerialization(param: {name: string, style: string, explode: boolean, allowReserved: boolean}): string {
  const {name, style, explode, allowReserved} = param;
  const encoding = allowReserved ? '' : 'encodeURIComponent';
  
  return `  // Serialize query parameter: ${name} (style: ${style}, explode: ${explode})
  if (this.${name} !== undefined && this.${name} !== null) {
    const value = this.${name};
    ${generateQuerySerializationLogic(name, style, explode, encoding)}
  }`;
}

// Constants for common serialization patterns
const RESULT_ASSIGNMENT = "result['";
const COMMA_SEPARATOR = ".join(',')";
const DOT_SEPARATOR = ".join('.')";

/**
 * Generate path parameter serialization logic
 */
function generatePathSerializationLogic(name: string, style: string, explode: boolean, encoding: string): string {
  const encodeValue = encoding ? `${encoding}(String(val))` : 'String(val)';
  const encodeScalarValue = encoding ? `${encoding}(String(value))` : 'String(value)';
  const encodeKey = encoding ? `${encoding}(key)` : 'key';
  
  switch (style) {
    case 'simple':
      return generateSimpleStyleLogic(name, explode, encodeValue, encodeScalarValue, encodeKey);
    case 'label':
      return generateLabelStyleLogic(name, explode, encodeValue, encodeScalarValue, encodeKey);
    case 'matrix':
      return generateMatrixStyleLogic(name, explode, encodeValue, encodeScalarValue, encodeKey);
    default:
      return `${RESULT_ASSIGNMENT}${name}'] = ${encodeScalarValue};`;
  }
}

/**
 * Generate query parameter serialization logic
 */
function generateQuerySerializationLogic(name: string, style: string, explode: boolean, encoding: string): string {
  const encodeValue = encoding ? `${encoding}(String(val))` : 'String(val)';
  const encodeScalarValue = encoding ? `${encoding}(String(value))` : 'String(value)';
  const encodeKey = encoding ? `${encoding}(key)` : 'key';
  
  switch (style) {
    case 'form':
      return generateFormStyleLogic(name, explode, encodeValue, encodeScalarValue, encodeKey);
    case 'spaceDelimited':
      return generateSpaceDelimitedLogic(name, explode, encodeValue, encodeScalarValue);
    case 'pipeDelimited':
      return generatePipeDelimitedLogic(name, explode, encodeValue, encodeScalarValue);
    case 'deepObject':
      return generateDeepObjectLogic(name, encodeValue, encodeKey);
    default:
      return `params.append('${name}', ${encodeScalarValue});`;
  }
}

/**
 * Generate serialization logic for simple style
 */
function generateSimpleStyleLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string, encodeKey: string): string {
  return `if (Array.isArray(value)) {
      ${RESULT_ASSIGNMENT}${name}'] = value.map(val => ${encodeValue})${COMMA_SEPARATOR};
    } else if (typeof value === 'object' && value !== null) {
      ${explode ?
        `${RESULT_ASSIGNMENT}${name}'] = Object.entries(value).map(([key, val]) => \`\${${encodeKey}}=\${${encodeValue}}\`)${COMMA_SEPARATOR};` :
        `${RESULT_ASSIGNMENT}${name}'] = Object.entries(value).map(([key, val]) => \`\${${encodeKey}},\${${encodeValue}}\`)${COMMA_SEPARATOR};`
      }
    } else {
      ${RESULT_ASSIGNMENT}${name}'] = ${encodeScalarValue};
    }`;
}

/**
 * Generate serialization logic for label style
 */
function generateLabelStyleLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string, encodeKey: string): string {
  return `if (Array.isArray(value)) {
      ${explode ?
        `${RESULT_ASSIGNMENT}${name}'] = '.' + value.map(val => ${encodeValue})${DOT_SEPARATOR};` :
        `${RESULT_ASSIGNMENT}${name}'] = '.' + value.map(val => ${encodeValue})${COMMA_SEPARATOR};`
      }
    } else if (typeof value === 'object' && value !== null) {
      ${explode ?
        `${RESULT_ASSIGNMENT}${name}'] = '.' + Object.entries(value).map(([key, val]) => \`\${${encodeKey}}=\${${encodeValue}}\`)${DOT_SEPARATOR};` :
        `${RESULT_ASSIGNMENT}${name}'] = '.' + Object.entries(value).map(([key, val]) => \`\${${encodeKey}},\${${encodeValue}}\`)${COMMA_SEPARATOR};`
      }
    } else {
      ${RESULT_ASSIGNMENT}${name}'] = '.' + ${encodeScalarValue};
    }`;
}

/**
 * Generate serialization logic for matrix style
 */
function generateMatrixStyleLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string, encodeKey: string): string {
  return `if (Array.isArray(value)) {
      ${explode ?
        `${RESULT_ASSIGNMENT}${name}'] = value.map(val => \`;${name}=\${${encodeValue}}\`).join('');` :
        `${RESULT_ASSIGNMENT}${name}'] = \`;${name}=\` + value.map(val => ${encodeValue})${COMMA_SEPARATOR};`
      }
    } else if (typeof value === 'object' && value !== null) {
      ${explode ?
        `${RESULT_ASSIGNMENT}${name}'] = Object.entries(value).map(([key, val]) => \`;\${${encodeKey}}=\${${encodeValue}}\`).join('');` :
        `${RESULT_ASSIGNMENT}${name}'] = \`;${name}=\` + Object.entries(value).map(([key, val]) => \`\${${encodeKey}},\${${encodeValue}}\`)${COMMA_SEPARATOR};`
      }
    } else {
      ${RESULT_ASSIGNMENT}${name}'] = \`;${name}=\` + ${encodeScalarValue};
    }`;
}

/**
 * Generate serialization logic for form style
 */
function generateFormStyleLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string, encodeKey: string): string {
  return `if (Array.isArray(value)) {
      ${explode ?
        `value.forEach(val => params.append('${name}', ${encodeValue}));` :
        `params.append('${name}', value.map(val => ${encodeValue}).join(','));`
      }
    } else if (typeof value === 'object' && value !== null) {
      ${explode ?
        `Object.entries(value).forEach(([key, val]) => params.append(${encodeKey}, ${encodeValue}));` :
        `params.append('${name}', Object.entries(value).map(([key, val]) => \`\${${encodeKey}},\${${encodeValue}}\`).join(','));`
      }
    } else {
      params.append('${name}', ${encodeScalarValue});
    }`;
}

/**
 * Generate serialization logic for space delimited style
 */
function generateSpaceDelimitedLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string): string {
  return `if (Array.isArray(value)) {
      ${explode ?
        `value.forEach(val => params.append('${name}', ${encodeValue}));` :
        `params.append('${name}', value.map(val => ${encodeValue}).join(' '));`
      }
    } else {
      params.append('${name}', ${encodeScalarValue});
    }`;
}

/**
 * Generate serialization logic for pipe delimited style
 */
function generatePipeDelimitedLogic(name: string, explode: boolean, encodeValue: string, encodeScalarValue: string): string {
  return `if (Array.isArray(value)) {
      ${explode ?
        `value.forEach(val => params.append('${name}', ${encodeValue}));` :
        `params.append('${name}', value.map(val => ${encodeValue}).join('|'));`
      }
    } else {
      params.append('${name}', ${encodeScalarValue});
    }`;
}

/**
 * Generate serialization logic for deep object style
 */
function generateDeepObjectLogic(name: string, encodeValue: string, encodeKey: string): string {
  return `if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.entries(value).forEach(([key, val]) => {
        params.append(\`${name}[\${key}]\`, ${encodeValue});
      });
    } else {
      params.append('${name}', String(value));
    }`;
}

/**
 * Convert OpenAPI 2.0 collectionFormat to OpenAPI 3.0 style and explode
 */
function convertCollectionFormatToStyleAndExplode(collectionFormat: string, location: string): {style: string, explode: boolean} {
  switch (collectionFormat) {
    case 'csv':
      return { style: location === 'query' ? 'form' : 'simple', explode: false };
    case 'ssv':
      return { style: 'spaceDelimited', explode: false };
    case 'tsv':
      // TSV not directly supported in OpenAPI 3.0, treat as csv
      return { style: location === 'query' ? 'form' : 'simple', explode: false };
    case 'pipes':
      return { style: 'pipeDelimited', explode: false };
    case 'multi':
      return { style: 'form', explode: true };
    default:
      return { style: location === 'query' ? 'form' : 'simple', explode: false };
  }
}

/**
 * Generate all deserialization methods
 */
function generateDeserializationMethods(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, queryParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, model: ConstrainedObjectModel): string {
  let methods = '';
  
  // Generate URL deserialization method
  if (queryParams.length > 0) {
    methods += generateUrlDeserializationMethod(queryParams, model);
  }
  
  // Generate static fromUrl method
  methods += generateFromUrlStaticMethod(pathParams, model);
  
  return methods;
}

/**
 * Generate URL deserialization method
 */
function generateUrlDeserializationMethod(queryParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, model: ConstrainedObjectModel): string {
  const paramDeserializations = queryParams.map(param => generateQueryParameterDeserialization(param, model)).join('\n');
  
  return `
/**
 * Deserialize URL and populate instance properties from query parameters
 * @param url The URL to parse (can be full URL or just query string)
 */
deserializeUrl(url: string): void {
  // Extract query string from URL
  let queryString = '';
  if (url.includes('?')) {
    queryString = url.split('?')[1];
  } else if (url.includes('=')) {
    // Assume it's already a query string
    queryString = url;
  }

  if (!queryString) {
    return;
  }

  const params = new URLSearchParams(queryString);

${paramDeserializations}
}`;
}

/**
 * Generate static fromUrl method
 */
function generateFromUrlStaticMethod(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, model: ConstrainedObjectModel): string {
  const properties = model.originalInput?.properties ?? {};
  const requiredParams: string[] = [];
  
  // Find required parameters to determine constructor defaults
  for (const [propName, propSchema] of Object.entries(properties)) {
    const paramConfig = processParameterSchema(propName, propSchema);
    if (paramConfig && model.originalInput?.required?.includes(propName)) {
      requiredParams.push(propName);
    }
  }

  // Generate path parameter extraction logic
  const pathParamExtraction = pathParams.length > 0 ? generatePathParameterExtraction(pathParams) : '';
  
  // Generate constructor arguments with path parameters first, then required non-path parameters
  const pathParamArgs = pathParams.map(param => `${param.name}: pathParams.${param.name}`).join(', ');
  const requiredNonPathParams = requiredParams.filter(param => 
    !pathParams.some(pathParam => pathParam.name === param)
  );
  const requiredParamArgs = requiredNonPathParams.map(param => `${param}: default${pascalCase(param)}`).join(', ');
  
  let constructorArgs = '';
  if (pathParamArgs && requiredParamArgs) {
    constructorArgs = `${pathParamArgs}, ${requiredParamArgs}`;
  } else if (pathParamArgs) {
    constructorArgs = pathParamArgs;
  } else if (requiredParamArgs) {
    constructorArgs = requiredParamArgs;
  }
  
  // Generate parameter documentation
  const paramDocs = requiredNonPathParams.length > 0 
    ? requiredNonPathParams.map(param => ` * @param default${pascalCase(param)} Default ${param} values (required parameter)`).join('\n')
    : '';
  
  // Generate function parameters
  const functionParams = requiredNonPathParams.length > 0 
    ? requiredNonPathParams.map(param => `, default${pascalCase(param)}: ${getParameterType(properties[param])} = ${generateDefaultValue(properties[param], param)}`).join('')
    : '';
  
  return `

/**
 * Static method to create a new instance from a URL
 * @param url The URL to parse
 * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')
${paramDocs}
 * @returns A new ${model.type} instance
 */
static fromUrl(url: string, basePath: string${functionParams}): ${model.type} {
  ${pathParamExtraction}
  const instance = new ${model.type}({ ${constructorArgs} });
  instance.deserializeUrl(url);
  return instance;
}`;
}

/**
 * Generate path parameter extraction logic for the fromUrl method
 */
function generatePathParameterExtraction(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>): string {
  if (pathParams.length === 0) {
    return '';
  }

  return `// Extract path parameters from URL
  const pathParams = this.extractPathParameters(url, basePath);`;
}

/**
 * Generate deserialization code for a single query parameter
 */
function generateQueryParameterDeserialization(param: {name: string, style: string, explode: boolean, allowReserved: boolean}, model: ConstrainedObjectModel): string {
  const {name, style, explode} = param;
  const properties = model.originalInput?.properties ?? {};
  const propSchema = properties[name];
  
  const logicCode = generateQueryDeserializationLogic(name, style, explode, propSchema);
  
  return `  // Deserialize query parameter: ${name} (style: ${style}, explode: ${explode})
  if (params.has('${name}')) {
    const value = params.get('${name}');
    ${logicCode}
  }`;
}

/**
 * Generate query parameter deserialization logic
 */
function generateQueryDeserializationLogic(name: string, style: string, explode: boolean, propSchema: any): string {
  const isArray = propSchema?.type === 'array' || propSchema?.items;
  const isBoolean = propSchema?.type === 'boolean';
  const isNumber = propSchema?.type === 'integer' || propSchema?.type === 'number';
  const paramType = getParameterType(propSchema);
  
  switch (style) {
    case 'form':
      return generateFormStyleDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
    case 'spaceDelimited':
      return generateSpaceDelimitedDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
    case 'pipeDelimited':
      return generatePipeDelimitedDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
    case 'deepObject':
      return generateDeepObjectDeserializationLogic(name, isBoolean, isNumber, paramType);
    default:
      return generateFormStyleDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
  }
}

/**
 * Generate deserialization logic for form style
 */
function generateFormStyleDeserializationLogic(name: string, explode: boolean, isArray: boolean, isBoolean: boolean, isNumber: boolean, paramType: string): string {
  if (isArray && !explode) {
    const typecast = paramType.includes('[]') ? ` as ${paramType}` : '';
    return `if (value === '') {
      this.${name} = [];
    } else if (value) {
      // Split by comma and decode
      const decodedValues = value.split(',').map(val => decodeURIComponent(val.trim()));
      this.${name} = decodedValues${typecast};
    }`;
  } else if (isArray && explode) {
    const typecast = paramType.includes('[]') ? ` as ${paramType}` : '';
    return `const allValues = params.getAll('${name}');
    if (allValues.length > 0) {
      const decodedValues = allValues.map(val => decodeURIComponent(val));
      this.${name} = decodedValues${typecast};
    }`;
  } else if (isBoolean) {
    return `if (value) {
      const decodedValue = decodeURIComponent(value);
      this.${name} = decodedValue.toLowerCase() === 'true';
    }`;
  } else if (isNumber) {
    return `if (value) {
      const decodedValue = decodeURIComponent(value);
      const numValue = Number(decodedValue);
      if (!isNaN(numValue)) {
        this.${name} = numValue;
      }
    }`;
  } 
    const typecast = paramType !== 'string' && paramType !== 'string | undefined' ? ` as ${paramType.replace(' | undefined', '')}` : '';
    return `if (value) {
      const decodedValue = decodeURIComponent(value);
      this.${name} = decodedValue${typecast};
    }`;
}

/**
 * Generate deserialization logic for space delimited style
 */
function generateSpaceDelimitedDeserializationLogic(name: string, explode: boolean, isArray: boolean, isBoolean: boolean, isNumber: boolean, paramType: string): string {
  if (isArray && !explode) {
    const typecast = paramType.includes('[]') ? ` as ${paramType}` : '';
    return `if (value === '') {
      this.${name} = [];
    } else if (value) {
      // Split by space and decode
      const decodedValues = value.split(' ').map(val => decodeURIComponent(val.trim()));
      this.${name} = decodedValues${typecast};
    }`;
  } 
    return generateFormStyleDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
}

/**
 * Generate deserialization logic for pipe delimited style
 */
function generatePipeDelimitedDeserializationLogic(name: string, explode: boolean, isArray: boolean, isBoolean: boolean, isNumber: boolean, paramType: string): string {
  if (isArray && !explode) {
    const typecast = paramType.includes('[]') ? ` as ${paramType}` : '';
    return `if (value === '') {
      this.${name} = [];
    } else if (value) {
      // Split by pipe and decode
      const decodedValues = value.split('|').map(val => decodeURIComponent(val.trim()));
      this.${name} = decodedValues${typecast};
    }`;
  } 
    return generateFormStyleDeserializationLogic(name, explode, isArray, isBoolean, isNumber, paramType);
}

/**
 * Generate deserialization logic for deep object style
 */
function generateDeepObjectDeserializationLogic(name: string, isBoolean: boolean, isNumber: boolean, paramType: string): string {
  const nameLength = name.length + 1;
  const typecast = paramType !== 'any' && paramType !== 'any | undefined' ? ` as ${paramType.replace(' | undefined', '')}` : '';
  return `// Deep object style deserialization
    const deepObjectParams: {[key: string]: any} = {};
    for (const [paramName, paramValue] of params.entries()) {
      if (paramName.startsWith('${name}[') && paramName.endsWith(']')) {
        const key = paramName.slice(${nameLength}, -1);
        deepObjectParams[key] = decodeURIComponent(paramValue);
      }
    }
    if (Object.keys(deepObjectParams).length > 0) {
      this.${name} = deepObjectParams${typecast};
    }`;
}

/**
 * Get parameter type for TypeScript casting
 */
function getParameterType(propSchema: any): string {
  if (!propSchema) {return 'any';}
  
  if (propSchema.type === 'array') {
    const itemType = propSchema.items?.type || 'string';
    const enumValues = propSchema.items?.enum;
    if (enumValues) {
      const enumTypes = enumValues.map((v: any) => `"${v}"`).join(' | ');
      return `(${enumTypes})[]`;
    }
    return `${itemType}[]`;
  } else if (propSchema.enum) {
    return propSchema.enum.map((v: any) => `"${v}"`).join(' | ');
  } else if (propSchema.type === 'integer' || propSchema.type === 'number') {
    return 'number';
  } else if (propSchema.type === 'boolean') {
    return 'boolean';
  } 
    return 'string';
}

/**
 * Generate default value for required parameters
 */
function generateDefaultValue(propSchema: any, paramName: string): string {
  if (!propSchema) {return '[]';}
  
  if (propSchema.type === 'array') {
    return '[]';
  } else if (propSchema.type === 'boolean') {
    return 'false';
  } else if (propSchema.type === 'integer' || propSchema.type === 'number') {
    return propSchema.default?.toString() || '0';
  } else if (propSchema.enum && propSchema.default) {
    return `"${propSchema.default}"`;
  } else if (propSchema.enum) {
    return `"${propSchema.enum[0]}"`;
  } 
    return propSchema.default ? `"${propSchema.default}"` : '""';
}

/**
 * Generate the extractPathParameters static method
 */
function generateExtractPathParametersMethod(pathParams: Array<{name: string, style: string, explode: boolean, allowReserved: boolean}>, model: ConstrainedObjectModel): string {
  const properties = model.originalInput?.properties ?? {};
  const paramExtractions = pathParams.map(param => {
    const propSchema = properties[param.name];
    const isNumber = propSchema?.type === 'integer' || propSchema?.type === 'number';
    const conversion = isNumber ? 'Number(decodeValue)' : 'decodeValue';
    const paramType = getParameterType(propSchema);
    const typecast = paramType !== 'string' ? ` as ${paramType}` : '';
    
    return `      case '${param.name}':
          result.${param.name} = ${conversion}${typecast};
          break;`;
  }).join('\n');

  return `

/**
 * Extract path parameters from a URL using a base path template
 * @param url The URL to extract parameters from
 * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')
 * @returns Object containing extracted path parameter values
 */
private static extractPathParameters(url: string, basePath: string): { ${pathParams.map(p => `${p.name}: ${getParameterType(properties[p.name])}`).join(', ')} } {
  // Remove query string from URL for path matching
  const urlPath = url.split('?')[0];
  
  // Create regex pattern from base path template
  const regexPattern = basePath.replace(/\\{([^}]+)\\}/g, '([^/]+)');
  const regex = new RegExp('^' + regexPattern + '$');
  
  const match = urlPath.match(regex);
  if (!match) {
    throw new Error(\`URL path '\${urlPath}' does not match base path template '\${basePath}'\`);
  }
  
  // Extract parameter names from base path template
  const paramNames = basePath.match(/\\{([^}]+)\\}/g)?.map(p => p.slice(1, -1)) || [];
  
  // Map matched values to parameter names
  const result: any = {};
  paramNames.forEach((paramName, index) => {
    const rawValue = match[index + 1];
    const decodeValue = decodeURIComponent(rawValue);
    switch (paramName) {
${paramExtractions}
      default:
        result[paramName] = decodeValue;
    }
  });
  
  return result;
}`;
}

export function createOpenAPIGenerator() {
  return new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    presets: [
      TS_DESCRIPTION_PRESET,
      {
        class: {
          additionalContent: ({content, model}) => {
            const additionalMethods = generateOpenAPIParameterMethods(model);
            return `${content}
${additionalMethods}`;
          }
        }
      }
    ]
  });
}
