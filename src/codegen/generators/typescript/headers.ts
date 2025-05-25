/* eslint-disable security/detect-object-injection */
import {
  OutputModel,
  TS_COMMON_PRESET,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, HeadersRenderType} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import { processAsyncAPIHeaders } from '../../inputs/asyncapi/generators/headers';
import { processOpenAPIHeaders } from '../../inputs/openapi/generators/headers';

export const zodTypescriptHeadersGenerator = z.object({
  id: z.string().optional().default('headers-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('headers').default('headers'),
  outputPath: z.string().default('src/__gen__/headers'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript')
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
  channelHeaders: Record<string, {
    schema: any;
    schemaId: string;
  } | undefined>;
}

// Core generator function that works with processed data
export async function generateTypescriptHeadersCore(
  processedData: ProcessedHeadersData,
  generator: TypescriptHeadersGeneratorInternal
): Promise<Record<string, OutputModel | undefined>> {
  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    presets: [
      TS_DESCRIPTION_PRESET,
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      }
    ]
  });

  const channelModels: Record<string, OutputModel | undefined> = {};

  for (const [channelId, headerData] of Object.entries(processedData.channelHeaders)) {
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
  const channelModels = await generateTypescriptHeadersCore(processedData, generator);

  return {
    channelModels,
    generator
  };
}
