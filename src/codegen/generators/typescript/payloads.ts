/* eslint-disable security/detect-object-injection */
import {
  ConstrainedEnumModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedUnionModel,
  ConstrainedArrayModel,
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
import {generateTypescriptValidationCode} from '../../modelina';

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
 * Extract status code value from a model
 */
function extractStatusCodeValue(
  model: ConstrainedMetaModel
): number | null {
  let memberOriginalInput;
  if (
    model instanceof ConstrainedReferenceModel &&
      model.ref instanceof ConstrainedObjectModel
  ) {
    memberOriginalInput = model.ref.originalInput;
  } else {
    memberOriginalInput = model.originalInput;
  }

  const statusCode = memberOriginalInput?.['x-modelina-status-codes'];

  if (!statusCode) {
    return null;
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
  model: ConstrainedMetaModel,
  codeValue: number
): string {
  if (model instanceof ConstrainedReferenceModel && model.ref instanceof ConstrainedObjectModel) {
    return `case ${codeValue}:
    return {statusCode, payload: ${model.type}.unmarshal(json)};`;
  // eslint-disable-next-line sonarjs/no-duplicated-branches
  } else if (model instanceof ConstrainedReferenceModel && model.ref instanceof ConstrainedUnionModel) {
    return `case ${codeValue}:
    return {statusCode, payload: ${model.type}.unmarshal(json)};`;
  } else if (model instanceof ConstrainedArrayModel) {
    const rendered = renderArrayUnmarshalCore(model);
    return `case ${codeValue}:
    ${rendered}
    return {statusCode, payload: unmarshalledArray};`;
  }
  return `case ${codeValue}:
    return {statusCode, payload: JSON.parse(json) as ${model.type}};`;
}

/**
 * Unmarshal based on status codes
 */
function renderUnmarshalByStatusCode(model: ConstrainedMetaModel) {
  if (!model.originalInput?.['x-modelina-has-status-codes']) {
    return '';
  }
  let statusCodeChecks: string[] = [];
  if (model instanceof ConstrainedUnionModel) {
    statusCodeChecks = model.union
      .map((unionMember) => {
        const codeValue = extractStatusCodeValue(unionMember);
        return codeValue !== null
          ? generateStatusCodeCheck(unionMember, codeValue)
          : null;
      })
      .filter((check) => check !== null);
  } else if (model instanceof ConstrainedArrayModel) {
    const codeValue = extractStatusCodeValue(model);
    if (codeValue !== null) {
      statusCodeChecks = [
        generateStatusCodeCheck(model.valueModel, codeValue)
      ];
    }
  } else {
    const codeValue = extractStatusCodeValue(model);
    if (codeValue !== null) {
      statusCodeChecks = [
        generateStatusCodeCheck(model, codeValue)
      ];
    }
  }
  return `export function unmarshalByStatusCode(json: any, statusCode: number): {error?: string, statusCode: number, payload?: ${model.name}} {
  switch(statusCode) {
    ${statusCodeChecks.join('\n')}
    default:
      return {error: \`No matching type found for status code: \${statusCode}\`, statusCode};
  }
}`;
}

/**
 * Render marshal function for array models
 */
function renderArrayMarshal(model: ConstrainedArrayModel) {
  const valueModel = model.valueModel;
  
  if (valueModel instanceof ConstrainedReferenceModel && 
      (valueModel.ref instanceof ConstrainedObjectModel || 
       valueModel.ref instanceof ConstrainedUnionModel)) {
    // Array of objects or unions - call their marshal methods
    return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload.map(item => {
    if (item && typeof item.marshal === 'function') {
      return JSON.parse(item.marshal());
    }
    return item;
  }));
}`;
  } else if (valueModel instanceof ConstrainedUnionModel) {
    // Array of union types - call union marshal function
    return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload.map(item => {
    // Call the specific union marshal function for each item
    return JSON.parse(marshal(item));
  }));
}`;
  } 
    // Array of primitives - direct serialization
    return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload);
}`;
}

function renderArrayUnmarshalCore(model: ConstrainedArrayModel) {
  const valueModel = model.valueModel;
  
  if (valueModel instanceof ConstrainedReferenceModel && 
      (valueModel.ref instanceof ConstrainedObjectModel || 
       valueModel.ref instanceof ConstrainedUnionModel)) {
    // Array of objects or unions - call their unmarshal methods
    const itemType = valueModel.type;
    return `const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(parsed)) {
    throw new Error('Expected array');
  }
  const unmarshalledArray = parsed.map(item => {
    if (item) {
      return ${itemType}.unmarshal(item);
    }
    return item;
  });`;
  } else if (valueModel instanceof ConstrainedUnionModel) {
    // Array of union types - call union unmarshal function
    return `const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(parsed)) {
    throw new Error('Expected array');
  }
  const unmarshalledArray = parsed.map(item => {
    return unmarshal(item);
  });`;
  } 
  // Array of primitives - direct deserialization
  return `const unmarshalledArray = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(unmarshalledArray)) {
    throw new Error('Expected array');
  }`;
}
/**
 * Render unmarshal function for array models
 */
function renderArrayUnmarshal(model: ConstrainedArrayModel) {
  return `export function unmarshal(json: any): ${model.name} {
  ${renderArrayUnmarshalCore(model)}
  return unmarshalledArray;
}`;
}

/**
 * Render marshal function for primitive types
 */
function renderPrimitiveMarshal(model: ConstrainedMetaModel) {
  return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload);
}`;
}

/**
 * Render unmarshal function for primitive types
 */
function renderPrimitiveUnmarshal(model: ConstrainedMetaModel) {
  return `export function unmarshal(json: any): ${model.name} {
  return typeof json === 'string' ? JSON.parse(json) : json;
}`;
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
export async function generateTypescriptPayloadsCoreFromSchemas({context, processedSchemaData} :{
  processedSchemaData: ProcessedPayloadSchemaData,
  context: TypeScriptPayloadContext
}): Promise<TypeScriptPayloadRenderType> {
  const {generator} = context;
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
            return `${content}
${generateTypescriptValidationCode({model, renderer, context})}`;
          }
        }
      },
      {
        type: {
          self({model, content, renderer}) {
            if (model instanceof ConstrainedUnionModel) {
              return `${content}

${renderUnionUnmarshal(model, renderer)}
${renderUnionMarshal(model)}
${renderUnmarshalByStatusCode(model)}
${generator.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context}) : ''}
`;
            } else if (model instanceof ConstrainedArrayModel) {
              return `${content}

${renderArrayUnmarshal(model)}
${renderArrayMarshal(model)}
${renderUnmarshalByStatusCode(model)}
${generator.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context}) : ''}
`;
            }
            return `${content}

${renderPrimitiveUnmarshal(model)}
${renderPrimitiveMarshal(model)}
${renderUnmarshalByStatusCode(model)}
${generator.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context}) : ''}
`;
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
        //Use first model as the root message model
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        channelModels[channelId] = {
          messageModel: models[0],
          messageType
        };

        // Add any additional models to otherModels
        for (let i = 1; i < models.length; i++) {
          const additionalModel = models[i].model;
          otherModels.push({
            messageModel: models[i],
            messageType: additionalModel.type
          });
        }
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
        //Use first model as the root message model
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        operationModels[operationId] = {
          messageModel: models[0],
          messageType
        };

        // Add any additional models to otherModels
        for (let i = 1; i < models.length; i++) {
          const additionalModel = models[i].model;
          otherModels.push({
            messageModel: models[i],
            messageType: additionalModel.type
          });
        }
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
  const {asyncapiDocument, openapiDocument, inputType} = context;

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
  return generateTypescriptPayloadsCoreFromSchemas({
    processedSchemaData,
    context
  });
}
