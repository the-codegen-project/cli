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
import {ImportExtension} from '../utils';

export interface GenerateModelsArgs {
  /** The Modelina generator instance */
  generator: TypeScriptFileGenerator;
  /** The input schema (JSON Schema or any format Modelina accepts) */
  input: unknown;
  /** The output path to use for file names (e.g., 'src/models') */
  outputPath: string;
  /** Optional render options */
  options?: Partial<TypeScriptRenderCompleteModelOptions>;
  /**
   * Extension to append to the relative imports Modelina renders between models
   * (for example the enum a model was split into). Modelina has no option for
   * this, so it is applied to the rendered output here.
   */
  importExtension?: ImportExtension;
}

/**
 * Matches the module specifier of a relative import/export/require that Modelina
 * renders between models, e.g. `from './Address'` or `require('./Address')`.
 * Specifiers that already carry an extension are left alone.
 */
const RELATIVE_MODULE_SPECIFIER =
  /(from\s+|require\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

/**
 * Appends `extension` to every extensionless relative module specifier in a
 * rendered model file. Modelina always renders cross-model dependencies as
 * `./<ModelName>` with no extension, which does not compile under
 * `moduleResolution: node16`/`nodenext`.
 */
export function applyImportExtension({
  content,
  extension
}: {
  content: string;
  extension: ImportExtension;
}): string {
  if (extension === 'none') {
    return content;
  }
  return content.replace(
    RELATIVE_MODULE_SPECIFIER,
    (match, keyword, quote, specifier) => {
      if (/\.[a-zA-Z0-9]+$/.test(specifier)) {
        return match;
      }
      return `${keyword}${quote}${specifier}${extension}${quote}`;
    }
  );
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
  options = {},
  importExtension = 'none'
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

    files.push({
      path: filePath,
      content: applyImportExtension({
        content: model.result,
        extension: importExtension
      })
    });
  }

  return {
    models: validModels,
    files
  };
}
