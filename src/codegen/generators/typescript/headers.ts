/* eslint-disable security/detect-object-injection */
import {
  OutputModel,
  TS_COMMON_PRESET,
  TS_DESCRIPTION_PRESET,
  typeScriptDefaultPropertyKeyConstraints,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, HeadersRenderType} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {processAsyncAPIHeaders} from '../../inputs/asyncapi/generators/headers';
import {processOpenAPIHeaders} from '../../inputs/openapi/generators/headers';
import {generateTypescriptValidationCode} from '../../modelina';

export const zodTypescriptHeadersGenerator = z.object({
  id: z.string().optional().default('headers-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('headers').default('headers'),
  outputPath: z.string().default('src/__gen__/headers'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript'),
  includeValidation: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models will be used to also validate headers'
    )
});

export type TypescriptHeadersGenerator = z.input<
  typeof zodTypescriptHeadersGenerator
>;
export type TypescriptHeadersGeneratorInternal = z.infer<
  typeof zodTypescriptHeadersGenerator
>;

export const defaultTypeScriptHeadersOptions: TypescriptHeadersGeneratorInternal =
  zodTypescriptHeadersGenerator.parse({});

export interface TypescriptHeadersContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypescriptHeadersGeneratorInternal;
}

export type TypeScriptHeadersRenderType =
  HeadersRenderType<TypescriptHeadersGeneratorInternal>;

// Interface for processed headers data (input-agnostic)
export interface ProcessedHeadersData {
  channelHeaders: Record<
    string,
    | {
        schema: any;
        schemaId: string;
      }
    | undefined
  >;
}

// Core generator function that works with processed data
export async function generateTypescriptHeadersCore({processedData, context}:{
  processedData: ProcessedHeadersData,
  context: TypescriptHeadersContext
}): Promise<Record<string, OutputModel | undefined>> {
  const {generator} = context;
  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    constraints: {
      propertyKey: typeScriptDefaultPropertyKeyConstraints({
        NO_SPECIAL_CHAR: (value) => value.replace(/[^a-zA-Z0-9]/g, '_')
      })
    },
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    presets: [
      TS_DESCRIPTION_PRESET,
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
      }
    ]
  });

  const channelModels: Record<string, OutputModel | undefined> = {};

  for (const [channelId, headerData] of Object.entries(
    processedData.channelHeaders
  )) {
    if (headerData) {
      const models = await modelinaGenerator.generateToFiles(
        headerData.schema,
        generator.outputPath,
        {exportType: 'named'},
        true
      );
      channelModels[channelId] = models[0];
    } else {
      channelModels[channelId] = undefined;
    }
  }

  return channelModels;
}

// Main generator function that orchestrates input processing and generation
export async function generateTypescriptHeaders(
  context: TypescriptHeadersContext
): Promise<TypeScriptHeadersRenderType> {
  const {asyncapiDocument, openapiDocument, inputType, generator} = context;

  let processedData: ProcessedHeadersData;

  // Process input based on type
  switch (inputType) {
    case 'asyncapi':
      if (!asyncapiDocument) {
        throw new Error('Expected AsyncAPI input, was not given');
      }
      processedData = processAsyncAPIHeaders(asyncapiDocument);
      break;
    case 'openapi':
      if (!openapiDocument) {
        throw new Error('Expected OpenAPI input, was not given');
      }
      processedData = processOpenAPIHeaders(openapiDocument);
      break;
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  // Generate models using processed data
  const channelModels = await generateTypescriptHeadersCore({
    processedData,
    context
  });

  return {
    channelModels,
    generator
  };
}
