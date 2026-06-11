/* eslint-disable security/detect-object-injection */
/**
 * TypeScript headers generator.
 *
 * Consumes `HeadersGeneratorInput` and emits Modelina-generated header
 * models, optionally with runtime validation. The generator does not
 * inspect the source document or `inputType` — the renderer dispatches
 * to the right input-format producer.
 */
import {OutputModel, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {
  GenericCodegenContext,
  HeadersRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {
  TS_DESCRIPTION_PRESET,
  TS_COMMON_PRESET,
  typeScriptDefaultPropertyKeyConstraints
} from '@asyncapi/modelina';
import {createValidationPreset} from '../../modelina/presets';
import {generateModels} from '../../output';
import {HeadersGeneratorInput} from './headers.input';

export {HeadersGeneratorInput, HeadersEntry} from './headers.input';

export const zodTypescriptHeadersGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('headers-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
    ),
  preset: z
    .literal('headers')
    .default('headers')
    .describe(
      'Generates typed message header models with optional runtime validation. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__/headers')
    .describe(
      'The directory path where the generated header models will be written. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
    ),
  serializationType: z
    .literal('json')
    .optional()
    .default('json')
    .describe(
      'The serialization format used by the generated header models. Currently only "json" is supported. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  includeValidation: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'When true (default), the generated header models include built-in JSON Schema validation methods so headers can be validated at runtime. [Read more about the headers generator here](https://the-codegen-project.org/docs/generators/headers)'
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
  /** Normalized headers input produced by an input-format producer. */
  input: HeadersGeneratorInput;
  generator: TypescriptHeadersGeneratorInternal;
  /**
   * AJV vocabularies to register before compiling validators. The
   * renderer populates this for input formats that need extra
   * vocabularies (e.g. OpenAPI → `['xml', 'example']`).
   */
  validationVocabularies?: string[];
}

export type TypeScriptHeadersRenderType =
  HeadersRenderType<TypescriptHeadersGeneratorInternal>;

// Interface kept for backward compat: previously this was the input
// shape; the canonical typed input is now `HeadersGeneratorInput`.
export type ProcessedHeadersData = HeadersGeneratorInput;

// Core generator function that works with processed data
export async function generateTypescriptHeadersCore({
  processedData,
  context
}: {
  processedData: HeadersGeneratorInput;
  context: TypescriptHeadersContext;
}): Promise<{
  channelModels: Record<string, OutputModel | undefined>;
  files: GeneratedFile[];
}> {
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
      createValidationPreset(
        {
          includeValidation: generator.includeValidation
        },
        context
      )
    ]
  });

  const channelModels: Record<string, OutputModel | undefined> = {};
  const files: GeneratedFile[] = [];

  for (const [channelId, headerData] of Object.entries(
    processedData.channelHeaders
  )) {
    if (headerData) {
      const result = await generateModels({
        generator: modelinaGenerator,
        input: headerData.schema,
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

  return {channelModels, files: uniqueFiles};
}

/**
 * Run the headers generator over a normalized `HeadersGeneratorInput`.
 */
export async function generateTypescriptHeaders(
  context: TypescriptHeadersContext
): Promise<TypeScriptHeadersRenderType> {
  const {generator} = context;

  const {channelModels, files} = await generateTypescriptHeadersCore({
    processedData: context.input,
    context
  });

  return {
    channelModels,
    generator,
    files
  };
}
