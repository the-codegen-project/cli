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
import {CodegenError, ErrorType} from '../../errors';
import {generateModels} from '../../output';

export const zodTypescriptModelsGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('models-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the models generator here](https://the-codegen-project.org/docs/generators/models)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the models generator here](https://the-codegen-project.org/docs/generators/models)'
    ),
  preset: z
    .literal('models')
    .default('models')
    .describe(
      'Generates raw data models directly using Modelina, without any messaging-related logic. Use this preset for plain typed models from JSON Schema, OpenAPI components, or AsyncAPI message schemas. [Read more about the models generator here](https://the-codegen-project.org/docs/generators/models)'
    ),
  renderers: zodTypeScriptPresets,
  options: zodTypeScriptOptions
    .optional()
    .describe(
      'Modelina TypeScriptOptions used to configure the underlying TypeScript code generation (model type, enum representation, module system, constraints, etc.). [Read more about the models generator here](https://the-codegen-project.org/docs/generators/models)'
    ),
  outputPath: z
    .string()
    .optional()
    .default('src/__gen__/models')
    .describe(
      'The directory path where the generated models will be written. [Read more about the models generator here](https://the-codegen-project.org/docs/generators/models)'
    ),
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
    throw new CodegenError({
      type: ErrorType.MISSING_INPUT_DOCUMENT,
      message: 'No input document provided for models generation',
      help: `Ensure your configuration specifies 'inputPath' pointing to a valid AsyncAPI, OpenAPI, or JSON Schema document.\n\nFor more information: https://the-codegen-project.org/docs/configurations`
    });
  }

  const result = await generateModels({
    generator: modelGenerator,
    input: inputDocument,
    outputPath: generator.outputPath
  });

  return {
    generator,
    files: result.files
  };
}
