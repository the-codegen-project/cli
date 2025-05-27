/* eslint-disable security/detect-object-injection */
import {
  ConstrainedEnumModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedUnionModel,
  TS_COMMON_PRESET,
  TypeScriptFileGenerator,
  OutputModel
} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  processAsyncAPIPayloads,
  ProcessedPayloadSchemaData
} from '../../inputs/asyncapi/generators/payloads';
import {processOpenAPIPayloads} from '../../inputs/openapi/generators/payloads';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {Logger} from '../../../LoggingInterface';
import {TypeScriptRenderer} from '@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

export const zodTypeScriptPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().optional().default('src/__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript'),
  enum: z
    .enum(['enum', 'union'])
    .optional()
    .default('enum')
    .describe(
      'By default all payloads enum types are generated as separate enum types, but in some cases a simple union type might be more prudent.'
    ),
  map: z
    .enum(['indexedObject', 'map', 'record'])
    .optional()
    .default('record')
    .describe('Which map type to use when a dictionary type is needed'),
  useForJavaScript: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models might be transpiled to JS, therefore JS restrictions will be applied by default.'
    ),
  includeValidation: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models will be used to also validate incoming data.'
    ),
  rawPropertyNames: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Use raw property names instead of constrained ones, where you most likely need to access them with obj["propertyName"] instead of obj.propertyName'
    )
});

export type TypeScriptPayloadGenerator = z.input<
  typeof zodTypeScriptPayloadGenerator
>;

export type TypeScriptPayloadGeneratorInternal = z.infer<
  typeof zodTypeScriptPayloadGenerator
>;

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGeneratorInternal =
  zodTypeScriptPayloadGenerator.parse({});

export interface TypeScriptPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypeScriptPayloadGeneratorInternal;
}

export type TypeScriptPayloadRenderType =
  PayloadRenderType<TypeScriptPayloadGeneratorInternal>;

// Interface for processed payloads data (input-agnostic)
export interface ProcessedPayloadData {
  channelModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  >;
  operationModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  >;
  otherModels: Array<{messageModel: OutputModel; messageType: string}>;
}

/**
 * Find the best possible discriminator value along side the properties using;
 * - Enum value
 * - Constant
 */
function findBestDiscriminatorOption(
  model: ConstrainedObjectModel,
  renderer: TypeScriptRenderer
) {
  //find first const or enum value since no explicit discriminator property found
  const firstFound = Object.values(model.properties)
    .map((property) => {
      const enumModel =
        property.property instanceof ConstrainedReferenceModel &&
        property.property.ref instanceof ConstrainedEnumModel
          ? property.property.ref
          : undefined;
      const constValue = property.property.options.const
        ? property.property.options.const.value
        : undefined;
      return {
        isEnumModel: enumModel !== undefined,
        isConst: constValue !== undefined,
        constValue,
        enumModel,
        property
      };
    })
    .filter(({isConst, isEnumModel}) => {
      return isConst || isEnumModel;
    });
  if (firstFound.length > 1) {
    const potentialProperties = firstFound
      .map(({property}) => {
        return property.propertyName;
      })
      .join(', ');
    Logger.warn(
      `More then one property could be discriminator for union model ${model.name}, found property ${potentialProperties}`
    );
  }
  if (firstFound.length >= 1) {
    const firstIsBest = firstFound[0];
    const discriminatorValue = firstIsBest.property.unconstrainedPropertyName;
    if (firstIsBest.isEnumModel) {
      const enumModel = firstIsBest.enumModel as ConstrainedEnumModel;
      renderer.dependencyManager.addTypeScriptDependency(
        `{${enumModel.type}}`,
        `./${enumModel.type}`
      );
      return {
        objCheck: `if(json.${discriminatorValue} === ${enumModel.type}.${enumModel.values[0].key}) {
  return ${model.name}.unmarshal(json);
  }`
      };
    } else if (firstIsBest.isConst) {
      return {
        objCheck: `if(json.${discriminatorValue} === ${firstIsBest.constValue}) {
  return ${model.name}.unmarshal(json);
  }`
      };
    }
    Logger.warn(
      `Could not determine discriminator for ${model.name}, as part of ${model.name}, will not be able to serialize or deserialize messages with this payload`
    );
    return {};
  }
}

function findDiscriminatorChecks(
  model: ConstrainedMetaModel,
  renderer: TypeScriptRenderer
) {
  if (
    model instanceof ConstrainedReferenceModel &&
    model.ref instanceof ConstrainedObjectModel
  ) {
    const discriminatorValue = model.options.discriminator?.type;
    if (!discriminatorValue) {
      return findBestDiscriminatorOption(model.ref, renderer);
    }

    // Use discriminatorValue to figure out if we unmarshal it
    return {
      objCheck: `if(json.${model.options.discriminator?.discriminator} === ${discriminatorValue}}) {
return ${model.type}.unmarshal(json);
}`
    };
  }
  return {};
}
function renderUnionMarshal(model: ConstrainedUnionModel) {
  const unmarshalChecks = model.union.map((unionModel) => {
    if (
      unionModel instanceof ConstrainedReferenceModel &&
      unionModel.ref instanceof ConstrainedObjectModel
    ) {
      return `if(payload instanceof ${unionModel.type}) {
return payload.marshal();
}`;
    }
  });
  return `export function marshal(payload: ${model.name}) {
  ${unmarshalChecks.join('\n')}
  return JSON.stringify(payload);
}`;
}
function renderUnionUnmarshal(
  model: ConstrainedUnionModel,
  renderer: TypeScriptRenderer
) {
  const discriminatorChecks = model.union.map((model) => {
    return findDiscriminatorChecks(model, renderer);
  });
  const hasObjValues =
    discriminatorChecks.filter((value) => value?.objCheck).length >= 1;
  return `export function unmarshal(json: any): ${model.name} {
  ${
    hasObjValues
      ? `if(typeof json === 'object') {
    ${discriminatorChecks
      .filter((value) => value?.objCheck)
      .map((value) => value?.objCheck)
      .join('\n  ')}
  }`
      : ''
  }
  return JSON.parse(json);
}`;
}

/**
 * Extract status code value from union member
 */
function extractStatusCodeValue(
  unionMember: ConstrainedMetaModel
): number | null {
  if (
    !(
      unionMember instanceof ConstrainedReferenceModel &&
      unionMember.ref instanceof ConstrainedObjectModel
    )
  ) {
    return null;
  }

  const memberOriginalInput = unionMember.ref.originalInput;
  const statusCode = memberOriginalInput?.['x-modelina-status-codes'];

  if (!statusCode) {
    return null;
  }

  if (typeof statusCode === 'object' && statusCode.code !== undefined) {
    return statusCode.code;
  }

  if (typeof statusCode === 'number') {
    return statusCode;
  }

  return null;
}

/**
 * Generate status code check string for a union member
 */
function generateStatusCodeCheck(
  unionMember: ConstrainedMetaModel,
  codeValue: number
): string {
  return `  if (statusCode === ${codeValue}) {
    return ${unionMember.type}.unmarshal(json);
  }`;
}

/**
 * Render status code based unmarshal function for union models
 */
function renderUnionUnmarshalByStatusCode(model: ConstrainedUnionModel) {
  if (!model.originalInput?.['x-modelina-has-status-codes']) {
    return '';
  }

  const statusCodeChecks = model.union
    .map((unionMember) => {
      const codeValue = extractStatusCodeValue(unionMember);
      return codeValue !== null
        ? generateStatusCodeCheck(unionMember, codeValue)
        : null;
    })
    .filter((check) => check !== null);

  if (statusCodeChecks.length === 0) {
    return '';
  }

  return `
export function unmarshalByStatusCode(json: any, statusCode: number): ${model.name} {
${statusCodeChecks.join('\n')}
  throw new Error(\`No matching type found for status code: \${statusCode}\`);
}`;
}

/**
 * Safe stringify that removes x- properties and circular references by assuming true
 */
export function safeStringify(value: any): string {
  let depth = 0;
  const maxDepth = 255;
  const maxRepetitions = 5; // Allow up to 5 repetitions of the same object

  // eslint-disable-next-line sonarjs/cognitive-complexity
  function stringify(val: any, currentPath: any[] = []): any {
    // Check depth limit
    if (depth > maxDepth) {
      return true;
    }

    switch (typeof val) {
      case 'function':
        return true;
      case 'boolean':
      case 'number':
      case 'string':
        return val;
      case 'object': {
        if (val === null) {
          return null;
        }

        // Check for immediate circular reference (direct self-reference)
        if (
          currentPath.length > 0 &&
          currentPath[currentPath.length - 1] === val
        ) {
          return true;
        }

        // Count how many times this object appears in the current path
        const repetitionCount = currentPath.filter((obj) => obj === val).length;

        // If we've seen this object too many times in the current path, cut it off
        if (repetitionCount >= maxRepetitions) {
          return true;
        }

        depth++;
        const newPath = [...currentPath, val];

        let result: any;

        if (Array.isArray(val)) {
          result = val.map((item) => stringify(item, newPath));
        } else {
          result = {};
          for (const [key, value] of Object.entries(val)) {
            // Skip extension properties
            if (
              key.startsWith('x-modelina') ||
              key.startsWith('x-the-codegen-project') ||
              key.startsWith('x-parser-') ||
              key.startsWith('x-modelgen-') ||
              key.startsWith('discriminator')
            ) {
              continue;
            }
            result[key] = stringify(value, newPath);
          }
        }

        depth--;
        return result;
      }
      case 'undefined':
        return undefined;
      default:
        return true;
    }
  }

  return JSON.stringify(stringify(value));
}

// Core generator function that works with processed data
export async function generateTypescriptPayloadsCore(
  processedData: ProcessedPayloadData,
  generator: TypeScriptPayloadGeneratorInternal
): Promise<TypeScriptPayloadRenderType> {
  // The models are already generated by the input processors,
  // so we just need to return them in the expected format
  return {
    channelModels: processedData.channelModels,
    operationModels: processedData.operationModels,
    otherModels: processedData.otherModels,
    generator
  };
}

// Core generator function that works with processed schema data
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypescriptPayloadsCoreFromSchemas(
  processedSchemaData: ProcessedPayloadSchemaData,
  generator: TypeScriptPayloadGeneratorInternal
): Promise<TypeScriptPayloadRenderType> {
  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    presets: [
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      },
      {
        class: {
          additionalContent: ({content, model, renderer}) => {
            if (!generator.includeValidation) {
              return content;
            }
            renderer.dependencyManager.addTypeScriptDependency(
              '{Ajv, Options as AjvOptions, ErrorObject, ValidateFunction}',
              'ajv'
            );
            renderer.dependencyManager.addTypeScriptDependency(
              'addFormats',
              'ajv-formats'
            );
            return `${content}
public static theCodeGenSchema = ${safeStringify(model.originalInput)};
public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const validate = ajvValidatorFunction ?? this.createValidator(context)
  return {
    valid: validate(parsedData),
    errors: validate.errors ?? undefined,
  };
}
public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
  addFormats(ajvInstance);
  const validate = ajvInstance.compile(this.theCodeGenSchema);
  return validate;
}
`;
          }
        }
      },
      {
        type: {
          self({model, content, renderer}) {
            if (model instanceof ConstrainedUnionModel) {
              if (!generator.includeValidation) {
                return content;
              }
              renderer.dependencyManager.addTypeScriptDependency(
                '{Ajv, Options as AjvOptions, ErrorObject, ValidateFunction}',
                'ajv'
              );
              renderer.dependencyManager.addTypeScriptDependency(
                'addFormats',
                'ajv-formats'
              );
              return `${content}

export const theCodeGenSchema = ${safeStringify(model.originalInput)};
export function validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const validate = ajvValidatorFunction ?? createValidator(context)
  return {
    valid: validate(parsedData),
    errors: validate.errors ?? undefined,
  };
}
export function createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
  addFormats(ajvInstance);
  const validate = ajvInstance.compile(theCodeGenSchema);
  return validate;
}
${renderUnionUnmarshal(model, renderer)}
${renderUnionMarshal(model)}
${renderUnionUnmarshalByStatusCode(model)}`;
            }
            return content;
          }
        }
      }
    ],
    enumType: generator.enum,
    mapType: generator.map,
    rawPropertyNames: generator.rawPropertyNames,
    useJavascriptReservedKeywords: generator.useForJavaScript
  });

  const channelModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  > = {};
  const operationModels: Record<
    string,
    {messageModel: OutputModel; messageType: string}
  > = {};
  const otherModels: Array<{messageModel: OutputModel; messageType: string}> =
    [];

  // Generate models for channel payloads
  for (const [channelId, schemaData] of Object.entries(
    processedSchemaData.channelPayloads
  )) {
    if (schemaData) {
      const models = await modelinaGenerator.generateToFiles(
        schemaData.schema,
        generator.outputPath,
        {exportType: 'named'},
        true
      );
      if (models.length > 0) {
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        channelModels[channelId] = {
          messageModel: models[0],
          messageType
        };
      }
    }
  }

  // Generate models for operation payloads
  for (const [operationId, schemaData] of Object.entries(
    processedSchemaData.operationPayloads
  )) {
    if (schemaData) {
      const models = await modelinaGenerator.generateToFiles(
        schemaData.schema,
        generator.outputPath,
        {exportType: 'named'},
        true
      );
      if (models.length > 0) {
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        operationModels[operationId] = {
          messageModel: models[0],
          messageType
        };
      }
    }
  }

  // Generate models for other payloads
  for (const schemaData of processedSchemaData.otherPayloads) {
    const models = await modelinaGenerator.generateToFiles(
      schemaData.schema,
      generator.outputPath,
      {exportType: 'named'},
      true
    );
    for (const model of models) {
      const messageModel = model.model;
      let messageType = messageModel.type;
      if (!(messageModel instanceof ConstrainedObjectModel)) {
        messageType = messageModel.name;
      }
      otherModels.push({
        messageModel: model,
        messageType
      });
    }
  }

  return {
    channelModels,
    operationModels,
    otherModels,
    generator
  };
}

// Main generator function that orchestrates input processing and generation
export async function generateTypescriptPayload(
  context: TypeScriptPayloadContext
): Promise<TypeScriptPayloadRenderType> {
  const {asyncapiDocument, openapiDocument, inputType, generator} = context;

  let processedSchemaData: ProcessedPayloadSchemaData;

  // Process input based on type
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw new Error('Expected AsyncAPI input, was not given');
      }

      processedSchemaData = await processAsyncAPIPayloads(asyncapiDocument);
      break;
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw new Error('Expected OpenAPI input, was not given');
      }

      processedSchemaData = processOpenAPIPayloads(openapiDocument);
      break;
    }
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  // Generate final result using processed schema data
  return generateTypescriptPayloadsCoreFromSchemas(
    processedSchemaData,
    generator
  );
}
