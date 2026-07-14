/* eslint-disable security/detect-object-injection */
import {OutputModel, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  GenericCodegenContext,
  HeadersRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {processAsyncAPIHeaders} from '../../inputs/asyncapi/generators/headers';
import {
  processOpenAPIHeaders,
  createOpenAPIHeadersGenerator,
  generateOpenAPIHeaderFunctions
} from '../../inputs/openapi/generators/headers';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {
  TS_DESCRIPTION_PRESET,
  TS_COMMON_PRESET,
  typeScriptDefaultPropertyKeyConstraints
} from '@asyncapi/modelina';
import {createValidationPreset} from '../../modelina/presets';
import {createMissingInputDocumentError} from '../../errors';
import {generateModels} from '../../output';

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
        schema: unknown;
        schemaId: string;
      }
    | undefined
  >;
}

// Core generator function that works with processed data
export async function generateTypescriptHeadersCore({
  processedData,
  context
}: {
  processedData: ProcessedHeadersData;
  context: TypescriptHeadersContext;
}): Promise<{
  channelModels: Record<string, OutputModel | undefined>;
  files: GeneratedFile[];
  headerFunctions: Record<string, string[]>;
}> {
  const {generator, inputType} = context;
  const isOpenAPI = inputType === 'openapi';

  const modelinaGenerator = isOpenAPI
    ? createOpenAPIHeadersGenerator()
    : new TypeScriptFileGenerator({
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
  const headerFunctions: Record<string, string[]> = {};

  for (const [channelId, headerData] of Object.entries(
    processedData.channelHeaders
  )) {
    if (headerData) {
      const result = await generateModels({
        generator: modelinaGenerator,
        input: headerData.schema,
        outputPath: generator.outputPath
      });

      if (isOpenAPI) {
        for (const model of result.models) {
          if (model.model instanceof ConstrainedObjectModel) {
            const constrainedModel = model.model as ConstrainedObjectModel;
            const fns = generateOpenAPIHeaderFunctions(constrainedModel);

            const modelFileName = `${model.modelName}.ts`;
            const fileIndex = result.files.findIndex((f) =>
              f.path.endsWith(modelFileName)
            );
            if (fileIndex !== -1) {
              result.files[fileIndex] = {
                ...result.files[fileIndex],
                content: `${result.files[fileIndex].content}\n\n${fns}`
              };
            }

            const modelName = constrainedModel.name;
            headerFunctions[modelName] = [`serialize${modelName}Headers`];
          }
        }
      }

      channelModels[channelId] =
        result.models.length > 0 ? result.models[0] : undefined;
      files.push(...result.files);
    } else {
      channelModels[channelId] = undefined;
    }
  }

  // Deduplicate files by path, keeping the last version (which has functions appended)
  const uniqueFiles: GeneratedFile[] = [];
  const seenPaths = new Map<string, number>();
  for (const file of files) {
    if (!seenPaths.has(file.path)) {
      seenPaths.set(file.path, uniqueFiles.length);
      uniqueFiles.push(file);
    } else {
      const existingIndex = seenPaths.get(file.path);
      if (existingIndex !== undefined) {
        uniqueFiles[existingIndex] = file;
      }
    }
  }

  return {channelModels, files: uniqueFiles, headerFunctions};
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
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'headers'
        });
      }
      processedData = processAsyncAPIHeaders(asyncapiDocument);
      break;
    case 'openapi':
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'headers'
        });
      }
      processedData = processOpenAPIHeaders(openapiDocument);
      break;
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  // Generate models using processed data
  const {channelModels, files, headerFunctions} =
    await generateTypescriptHeadersCore({
      processedData,
      context
    });

  return {
    channelModels,
    generator,
    files,
    headerFunctions
  };
}
