/* eslint-disable security/detect-object-injection, sonarjs/cognitive-complexity */
import {OutputModel, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  GenericCodegenContext,
  ParameterRenderType,
  GeneratedFile
} from '../../types';
import {z} from 'zod';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {
  createAsyncAPIGenerator,
  processAsyncAPIParameters,
  ProcessedParameterSchemaData
} from '../../inputs/asyncapi/generators/parameters';
import {
  createOpenAPIGenerator,
  processOpenAPIParameters
} from '../../inputs/openapi/generators/parameters';
import {createMissingInputDocumentError} from '../../errors';
import {generateModels} from '../../output';

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
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypescriptParametersGeneratorInternal;
}

export type TypeScriptParameterRenderType =
  ParameterRenderType<TypescriptParametersGeneratorInternal>;

// Main generator function that orchestrates input processing and generation
export async function generateTypescriptParameters(
  context: TypescriptParametersContext
): Promise<TypeScriptParameterRenderType> {
  const {asyncapiDocument, openapiDocument, inputType, generator} = context;

  const channelModels: Record<string, OutputModel | undefined> = {};
  const files: GeneratedFile[] = [];
  let processedSchemaData: ProcessedParameterSchemaData;
  let parameterGenerator: TypeScriptFileGenerator;

  // Process input based on type
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'parameters'
        });
      }

      processedSchemaData = await processAsyncAPIParameters(asyncapiDocument);
      parameterGenerator = createAsyncAPIGenerator();
      break;
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'parameters'
        });
      }

      processedSchemaData = processOpenAPIParameters(openapiDocument);
      parameterGenerator = createOpenAPIGenerator();
      break;
    }
    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }

  // Generate models for channel parameters
  for (const [channelId, schemaData] of Object.entries(
    processedSchemaData.channelParameters
  )) {
    if (schemaData) {
      const result = await generateModels({
        generator: parameterGenerator,
        input: schemaData.schema,
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
