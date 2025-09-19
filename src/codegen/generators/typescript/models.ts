/* eslint-disable security/detect-object-injection */
import {
  Presets,
  TypeScriptFileGenerator,
  TypeScriptOptions
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, ModelsRenderType} from '../../types';
import {z} from 'zod';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {zodTypeScriptOptions, zodTypeScriptPresets} from '../../modelina';
import {JsonSchemaDocument} from '../../inputs/jsonschema';

export const zodTypescriptModelsGenerator = z.object({
  id: z.string().optional().default('models-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('models').default('models'),
  renderers: zodTypeScriptPresets,
  options: zodTypeScriptOptions.optional(),
  outputPath: z.string().optional().default('src/__gen__/models'),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypescriptModelsGenerator = z.input<
  typeof zodTypescriptModelsGenerator
>;
export type TypescriptModelsGeneratorInternal = z.infer<
  typeof zodTypescriptModelsGenerator
>;

export const defaultTypeScriptModelsOptions: TypescriptModelsGeneratorInternal =
  zodTypescriptModelsGenerator.parse({});

export interface TypescriptModelsContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi' | 'jsonschema';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  jsonSchemaDocument?: JsonSchemaDocument;
  generator: TypescriptModelsGeneratorInternal;
}

export type TypeScriptModelsRenderType =
  ModelsRenderType<TypescriptModelsGeneratorInternal>;

// Main generator function that orchestrates input processing and generation
export async function generateTypescriptModels(
  context: TypescriptModelsContext
): Promise<TypeScriptModelsRenderType> {
  const {generator, asyncapiDocument, openapiDocument, jsonSchemaDocument} =
    context;

  // Create generator with default options
  const modelGenerator = new TypeScriptFileGenerator({
    ...(generator.options as unknown as TypeScriptOptions),
    presets: generator.renderers as unknown as Presets
  });

  // Determine which document to use based on input type
  const inputDocument =
    asyncapiDocument ?? openapiDocument ?? jsonSchemaDocument;

  if (!inputDocument) {
    throw new Error('No input document provided for models generation');
  }

  await modelGenerator.generateToFiles(
    inputDocument,
    generator.outputPath,
    {exportType: 'named'},
    true
  );

  return {
    generator
  };
}
