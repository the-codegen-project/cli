import {OutputModel} from '@asyncapi/modelina';
import {
  ChannelFunctionTypes,
  TypeScriptChannelRenderType,
  TypeScriptChannelsGenerator,
  TypeScriptChannelsGeneratorInternal,
  zodTypescriptChannelsGenerator
} from './generators/typescript/channels';
import {
  TypeScriptParameterRenderType,
  TypescriptParametersGenerator,
  TypescriptParametersGeneratorInternal,
  zodTypescriptParametersGenerator
} from './generators/typescript/parameters';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadGeneratorInternal,
  TypeScriptPayloadRenderType,
  zodTypeScriptPayloadGenerator
} from './generators/typescript/payloads';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  CustomGenerator,
  CustomGeneratorInternal,
  zodCustomGenerator
} from './generators/generic/custom';
import {z} from 'zod';
import {TypeScriptClientGenerator} from './generators';
import {
  TypeScriptClientGeneratorInternal,
  zodTypescriptClientGenerator
} from './generators/typescript/client';
import {
  TypescriptHeadersGenerator,
  TypescriptHeadersGeneratorInternal,
  TypeScriptHeadersRenderType,
  zodTypescriptHeadersGenerator
} from './generators/typescript/headers';
import {TypeScriptClientRenderType} from './generators/typescript/client/types';
import {
  TypescriptTypesGenerator,
  TypescriptTypesGeneratorInternal,
  TypeScriptTypesRenderType,
  zodTypescriptTypesGenerator
} from './generators/typescript/types';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {
  TypescriptModelsGenerator,
  TypescriptModelsGeneratorInternal,
  TypeScriptModelsRenderType,
  zodTypescriptModelsGenerator
} from './generators/typescript/models';
import {JsonSchemaDocument} from './inputs/jsonschema';

export type PresetTypes =
  | 'payloads'
  | 'parameters'
  | 'headers'
  | 'types'
  | 'channels'
  | 'models'
  | 'custom'
  | 'client';
export interface LoadArgument {
  configPath: string;
  configType: 'esm' | 'json' | 'yaml';
}
export type SupportedLanguages = 'typescript';
export interface GenericCodegenContext {
  dependencyOutputs: Record<string, any>;
  config?: TheCodegenConfiguration;
}

export const zodAsyncAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptChannelsGenerator,
  zodTypescriptClientGenerator,
  zodTypescriptHeadersGenerator,
  zodTypescriptTypesGenerator,
  zodTypescriptModelsGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPIGenerators = z.union([
  ...zodAsyncAPITypeScriptGenerators.options
]);

export const zodOpenAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptHeadersGenerator,
  zodTypescriptTypesGenerator,
  zodTypescriptChannelsGenerator,
  zodTypescriptModelsGenerator,
  zodCustomGenerator
]);

export const zodOpenAPIGenerators = z.union([
  ...zodOpenAPITypeScriptGenerators.options
]);

export const zodJsonSchemaTypeScriptGenerators = z.discriminatedUnion(
  'preset',
  [zodTypescriptModelsGenerator, zodCustomGenerator]
);

export const zodJsonSchemaGenerators = z.union([
  ...zodJsonSchemaTypeScriptGenerators.options
]);

export type Generators =
  | TypescriptHeadersGenerator
  | TypescriptTypesGenerator
  | TypeScriptPayloadGenerator
  | TypescriptParametersGenerator
  | TypeScriptChannelsGenerator
  | TypeScriptClientGenerator
  | TypescriptModelsGenerator
  | CustomGenerator;

export type GeneratorsInternal =
  | TypeScriptPayloadGeneratorInternal
  | TypescriptParametersGeneratorInternal
  | TypeScriptChannelsGeneratorInternal
  | TypeScriptClientGeneratorInternal
  | TypescriptHeadersGeneratorInternal
  | TypescriptTypesGeneratorInternal
  | TypescriptModelsGeneratorInternal
  | CustomGeneratorInternal;

export type RenderTypes =
  | TypeScriptChannelRenderType
  | TypeScriptPayloadRenderType
  | TypeScriptParameterRenderType
  | TypeScriptHeadersRenderType
  | TypeScriptTypesRenderType
  | TypeScriptClientRenderType
  | TypeScriptModelsRenderType
  | CustomGenerator;
export interface ParameterRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel | undefined>;
  generator: GeneratorType;
  filesWritten: string[];
}
export interface HeadersRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel | undefined>;
  generator: GeneratorType;
  filesWritten: string[];
}
export interface TypesRenderType<GeneratorType> {
  result: string;
  generator: GeneratorType;
  filesWritten: string[];
}
export interface ModelsRenderType<GeneratorType> {
  generator: GeneratorType;
  filesWritten: string[];
}
export interface ChannelPayload {
  messageModel: OutputModel;
  messageType: string;
  /**
   * Whether this payload includes status code-based unmarshalling (for union types with status codes).
   * When true, the HTTP client should use unmarshalByStatusCode(json, statusCode) instead of unmarshal(json).
   */
  includesStatusCodes?: boolean;
}
export interface PayloadRenderType<GeneratorType> {
  channelModels: Record<string, ChannelPayload>;
  operationModels: Record<string, ChannelPayload>;
  otherModels: ChannelPayload[];
  generator: GeneratorType;
  filesWritten: string[];
}
export interface SingleFunctionRenderType {
  functionName: string;
  code: string;
  dependencies: string[];
  functionType: ChannelFunctionTypes;
  messageType: string;
  replyType?: string;
}

export interface HttpRenderType {
  functionName: string;
  code: string;
  dependencies: string[];
  functionType: ChannelFunctionTypes;
  messageType?: string;
  replyType: string;
}

const SCHEMA_DESCRIPTION =
  'For JSON and YAML configuration files this is used to force the IDE to enable auto completion and validation features';
const LANGUAGE_DESCRIPTION =
  'Set the global language for all generators, either one needs to be set';
const DOCUMENT_TYPE_DESCRIPTION = 'The type of document';

/**
 * Project-level telemetry configuration
 * Allows overriding global telemetry settings for specific projects
 */
export const zodProjectTelemetryConfig = z
  .object({
    enabled: z
      .boolean()
      .optional()
      .describe(
        'Enable or disable telemetry for this project (overrides global setting)'
      ),
    endpoint: z
      .string()
      .optional()
      .describe('Custom telemetry endpoint (overrides global setting)'),
    trackingId: z
      .string()
      .optional()
      .describe('Custom tracking ID (overrides global setting)')
  })
  .optional()
  .describe(
    'Project-level telemetry configuration (overrides global settings in ~/.the-codegen-project/config.json)'
  );

export type ProjectTelemetryConfig = z.infer<typeof zodProjectTelemetryConfig>;

export const zodAsyncAPICodegenConfiguration = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('asyncapi').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe('The path to the input document'),
  language: z.enum(['typescript']).optional().describe(LANGUAGE_DESCRIPTION),
  generators: z.array(zodAsyncAPIGenerators),
  telemetry: zodProjectTelemetryConfig
});

export const zodOpenAPICodegenConfiguration = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('openapi').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe('The path to the input document '),
  language: z.enum(['typescript']).optional().describe(LANGUAGE_DESCRIPTION),
  generators: z.array(zodOpenAPIGenerators),
  telemetry: zodProjectTelemetryConfig
});

export const zodJsonSchemaCodegenConfiguration = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('jsonschema').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe('The path to the JSON Schema document'),
  language: z.enum(['typescript']).optional().describe(LANGUAGE_DESCRIPTION),
  generators: z.array(zodJsonSchemaGenerators),
  telemetry: zodProjectTelemetryConfig
});

export const zodTheCodegenConfiguration: z.ZodDiscriminatedUnion<
  'inputType',
  [
    typeof zodAsyncAPICodegenConfiguration,
    typeof zodOpenAPICodegenConfiguration,
    typeof zodJsonSchemaCodegenConfiguration
  ]
> = z.discriminatedUnion('inputType', [
  zodAsyncAPICodegenConfiguration,
  zodOpenAPICodegenConfiguration,
  zodJsonSchemaCodegenConfiguration
]);

export type TheCodegenConfiguration = z.input<
  typeof zodTheCodegenConfiguration
>;

export type TheCodegenConfigurationInternal = z.infer<
  typeof zodTheCodegenConfiguration
>;

export interface RunGeneratorContext {
  configuration: TheCodegenConfiguration;
  configFilePath: string;
  documentPath: string;
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  jsonSchemaDocument?: JsonSchemaDocument;
}

/**
 * Result of a single generator execution
 */
export interface GeneratorResult {
  /** Generator ID from configuration */
  id: string;
  /** Generator preset type */
  preset: string;
  /** Files written by this generator (absolute paths) */
  filesWritten: string[];
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Result of the entire generation process
 */
export interface GenerationResult {
  /** Results from each generator */
  generators: GeneratorResult[];
  /** Total number of files written */
  totalFiles: number;
  /** Total duration in milliseconds */
  totalDuration: number;
  /** All file paths written (deduplicated, absolute) */
  allFiles: string[];
}
