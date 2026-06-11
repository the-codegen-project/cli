/**
 * TypeScript models generator (uses Modelina).
 *
 * `models` is one of the two documented exceptions where the input is
 * a typed envelope over the source document(s) rather than a fully
 * normalized IR — Modelina IS the extractor, since model generation
 * is document-wide. The producer chooses which slot to populate; the
 * generator passes the present document to Modelina.
 */
/* eslint-disable security/detect-object-injection */
import {
  Presets,
  TypeScriptFileGenerator,
  TypeScriptOptions
} from '@asyncapi/modelina';
import {GenericCodegenContext, ModelsRenderType} from '../../types';
import {z} from 'zod';
import {zodTypeScriptOptions, zodTypeScriptPresets} from '../../modelina';
import {CodegenError, ErrorType} from '../../errors';
import {generateModels} from '../../output';
import {ModelsGeneratorInput} from './models.input';

export {ModelsGeneratorInput} from './models.input';

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
  /**
   * Typed envelope over the source documents. Producers populate the
   * matching slot; the generator hands the present document to Modelina.
   */
  input: ModelsGeneratorInput;
  generator: TypescriptModelsGeneratorInternal;
}

export type TypeScriptModelsRenderType =
  ModelsRenderType<TypescriptModelsGeneratorInternal>;

export async function generateTypescriptModels(
  context: TypescriptModelsContext
): Promise<TypeScriptModelsRenderType> {
  const {generator, input} = context;

  // Create generator with default options
  const modelGenerator = new TypeScriptFileGenerator({
    ...(generator.options as unknown as TypeScriptOptions),
    presets: generator.renderers as unknown as Presets
  });

  // Modelina accepts AsyncAPI / OpenAPI / JSON Schema documents directly.
  // The producer fills exactly the slot for the configured input type;
  // EventCatalog producers may fill multiple slots in future phases.
  const inputDocument = input.asyncapi ?? input.openapi ?? input.jsonSchema;

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
