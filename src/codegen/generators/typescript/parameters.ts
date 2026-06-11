/* eslint-disable security/detect-object-injection, sonarjs/cognitive-complexity */
/**
 * TypeScript parameters generator.
 *
 * Consumes `ParameterGeneratorInput` and emits Modelina-generated
 * parameter models. The generator picks one of two Modelina
 * additionalContent presets based on each entry's
 * `serializationStyle`:
 *   - `channel-address` → AsyncAPI-style channel/topic interpolation
 *     (`getChannelWithParameters`, `createFromChannel`)
 *   - `http-url` → OpenAPI-style URL templating (`serializeUrl`,
 *     `deserializeUrl`, `fromUrl`)
 *
 * The generator never inspects the source document or `inputType`.
 */
import {OutputModel, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {
  GenericCodegenContext,
  ParameterRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {createAsyncAPIGenerator} from '../../inputs/asyncapi/producers/parameters';
import {createOpenAPIGenerator} from '../../inputs/openapi/producers/parameters';
import {generateModels} from '../../output';
import {ParameterEntry, ParameterGeneratorInput} from './parameters.input';

export {
  ParameterGeneratorInput,
  ParameterEntry,
  ParameterSerializationStyle
} from './parameters.input';

export const zodTypescriptParametersGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('parameters-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  preset: z
    .literal('parameters')
    .default('parameters')
    .describe(
      'Generates typed channel/operation parameter models used to interpolate values into subjects, topics, and URL paths. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__/parameters')
    .describe(
      'The directory path where the generated parameter models will be written. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  serializationType: z
    .literal('json')
    .optional()
    .default('json')
    .describe(
      'The serialization format used by the generated parameter models. Currently only "json" is supported. [Read more about the parameters generator here](https://the-codegen-project.org/docs/generators/parameters)'
    ),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypescriptParametersGenerator = z.input<
  typeof zodTypescriptParametersGenerator
>;
export type TypescriptParametersGeneratorInternal = z.infer<
  typeof zodTypescriptParametersGenerator
>;

export const defaultTypeScriptParametersOptions: TypescriptParametersGeneratorInternal =
  zodTypescriptParametersGenerator.parse({});

export interface TypescriptParametersContext extends GenericCodegenContext {
  /** Normalized parameters input produced by an input-format producer. */
  input: ParameterGeneratorInput;
  generator: TypescriptParametersGeneratorInternal;
}

export type TypeScriptParameterRenderType =
  ParameterRenderType<TypescriptParametersGeneratorInternal>;

/**
 * Pick the Modelina TypeScriptFileGenerator instance whose
 * additionalContent preset matches a parameter entry's
 * `serializationStyle`. The generators are instantiated once per call
 * and reused across entries with the same style.
 */
function pickModelinaGenerator(
  style: ParameterEntry['serializationStyle'],
  cache: {
    channelAddress?: TypeScriptFileGenerator;
    httpUrl?: TypeScriptFileGenerator;
  }
): TypeScriptFileGenerator {
  if (style === 'channel-address') {
    if (!cache.channelAddress) {
      cache.channelAddress = createAsyncAPIGenerator();
    }
    return cache.channelAddress;
  }
  if (!cache.httpUrl) {
    cache.httpUrl = createOpenAPIGenerator();
  }
  return cache.httpUrl;
}

export async function generateTypescriptParameters(
  context: TypescriptParametersContext
): Promise<TypeScriptParameterRenderType> {
  const {generator, input} = context;

  const channelModels: Record<string, OutputModel | undefined> = {};
  const files: GeneratedFile[] = [];
  const generatorCache: {
    channelAddress?: TypeScriptFileGenerator;
    httpUrl?: TypeScriptFileGenerator;
  } = {};

  for (const [channelId, entry] of Object.entries(input.channelParameters)) {
    if (entry) {
      const parameterGenerator = pickModelinaGenerator(
        entry.serializationStyle,
        generatorCache
      );
      const result = await generateModels({
        generator: parameterGenerator,
        input: entry.schema,
        outputPath: generator.outputPath
      });
      channelModels[channelId] =
        result.models.length > 0 ? result.models[0] : undefined;
      files.push(...result.files);
    } else {
      channelModels[channelId] = undefined;
    }
  }

  // Deduplicate files by path
  const uniqueFiles: GeneratedFile[] = [];
  const seenPaths = new Set<string>();
  for (const file of files) {
    if (!seenPaths.has(file.path)) {
      seenPaths.add(file.path);
      uniqueFiles.push(file);
    }
  }

  return {
    channelModels,
    generator,
    files: uniqueFiles
  };
}
