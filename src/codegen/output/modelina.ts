/* eslint-disable security/detect-object-injection */
/**
 * Modelina integration for pure-core code generation.
 * Generates models in-memory and returns them as GeneratedFile[].
 * No I/O is performed - writing files is handled by the CLI layer.
 */
import {
  TypeScriptFileGenerator,
  TypeScriptRenderCompleteModelOptions,
  OutputModel
} from '@asyncapi/modelina';
import {GeneratedFile} from '../types';

export interface GenerateModelsArgs {
  /** The Modelina generator instance */
  generator: TypeScriptFileGenerator;
  /** The input schema (JSON Schema or any format Modelina accepts) */
  input: unknown;
  /** The output path to use for file names (e.g., 'src/models') */
  outputPath: string;
  /** Optional render options */
  options?: Partial<TypeScriptRenderCompleteModelOptions>;
}

export interface GenerateModelsResult {
  /** The generated models */
  models: OutputModel[];
  /** Generated files with path and content */
  files: GeneratedFile[];
}

/**
 * Generate models using Modelina.
 * Returns files as data - no I/O is performed.
 *
 * @returns The generated models and files
 */
export async function generateModels({
  generator,
  input,
  outputPath,
  options = {}
}: GenerateModelsArgs): Promise<GenerateModelsResult> {
  const files: GeneratedFile[] = [];

  // Use Modelina's generateCompleteModels() which returns OutputModel[] with rendered content
  // This is the same method used by generateToFiles() internally, but without writing to disk
  const models = await generator.generateCompleteModels(input, {
    exportType: options.exportType ?? 'named'
  });

  // Filter out any models that weren't successfully generated
  const validModels = models.filter((model) => model.modelName !== '');

  // Collect files as data (no I/O)
  for (const model of validModels) {
    const fileName = `${model.modelName}.ts`;
    const filePath = `${outputPath}/${fileName}`;

    files.push({path: filePath, content: model.result});
  }

  return {
    models: validModels,
    files
  };
}
