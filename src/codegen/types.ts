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
import {zodImportExtension} from './utils';

export type PresetTypes =
  | 'payloads'
  | 'parameters'
  | 'headers'
  | 'types'
  | 'channels'
  | 'models'
  | 'custom'
  | 'client';

/**
 * A generated file with path and content.
 * Returned by generators - no I/O performed.
 */
export interface GeneratedFile {
  /** Relative path (e.g., 'src/payloads/User.ts') */
  path: string;
  /** File content */
  content: string;
}
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
  /** Generated files with path and content */
  files: GeneratedFile[];
}
export interface HeadersRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel | undefined>;
  generator: GeneratorType;
  /** Generated files with path and content */
  files: GeneratedFile[];
}
export interface TypesRenderType<GeneratorType> {
  result: string;
  generator: GeneratorType;
  /** Generated files with path and content */
  files: GeneratedFile[];
}
export interface ModelsRenderType<GeneratorType> {
  generator: GeneratorType;
  /** Generated files with path and content */
  files: GeneratedFile[];
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
  /** Generated files with path and content */
  files: GeneratedFile[];
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
  'JSON Schema reference used by IDEs to enable auto-completion and validation in JSON and YAML configuration files. [Read more about configurations here](https://the-codegen-project.org/docs/configurations)';
const LANGUAGE_DESCRIPTION =
  'Sets the global language for all generators. Either this global value or each generator must define its own language. [Read more about configurations here](https://the-codegen-project.org/docs/configurations)';
const DOCUMENT_TYPE_DESCRIPTION =
  'The type of input document being processed (asyncapi, openapi, or jsonschema). [Read more about inputs here](https://the-codegen-project.org/docs/configurations)';
const INPUT_PATH_DESCRIPTION =
  'Path or URL to the input document used as the source for code generation. [Read more about configurations here](https://the-codegen-project.org/docs/configurations)';
const GENERATORS_DESCRIPTION =
  'The list of generators to run as part of this configuration. [Read more about generators here](https://the-codegen-project.org/docs/generators)';
const INPUT_AUTH_DESCRIPTION =
  'Authentication for fetching remote input specifications via http(s). Ignored for local file paths. ' +
  'WARNING: these credentials are sent to every URL the loader fetches, including external $ref targets on other hosts. ' +
  'See https://the-codegen-project.org/docs/configurations#auth-scope-and-security-considerations for details.';

/**
 * Authentication configuration for fetching remote input documents.
 * One of three shapes:
 *  - bearer: adds `Authorization: Bearer <token>`.
 *  - apiKey: adds `<header>: <value>`.
 *  - custom: adds the given headers verbatim.
 *
 * The same headers are attached to every URL the loader fetches,
 * including external `$ref` targets on other hosts.
 */
export const zodInputAuth = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('bearer'),
      token: z.string().min(1)
    }),
    z.object({
      type: z.literal('apiKey'),
      header: z.string().min(1),
      value: z.string().min(1)
    }),
    z.object({
      type: z.literal('custom'),
      headers: z.record(z.string(), z.string())
    })
  ])
  .optional()
  .describe(INPUT_AUTH_DESCRIPTION);

export type InputAuthConfig = z.infer<typeof zodInputAuth>;

// Re-export from utils - the canonical source of truth for import extension
export {zodImportExtension, ImportExtension} from './utils';

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
        'Enable or disable anonymous telemetry collection for this project. Overrides the global telemetry setting in ~/.the-codegen-project/config.json. [Read more about telemetry here](https://the-codegen-project.org/docs/telemetry)'
      ),
    endpoint: z
      .string()
      .optional()
      .describe(
        'Custom telemetry endpoint URL for self-hosted analytics. Overrides the global telemetry endpoint. [Read more about telemetry here](https://the-codegen-project.org/docs/telemetry)'
      ),
    trackingId: z
      .string()
      .optional()
      .describe(
        'Custom tracking ID used to attribute telemetry events to a specific project or organization. Overrides the global tracking ID. [Read more about telemetry here](https://the-codegen-project.org/docs/telemetry)'
      )
  })
  .optional()
  .describe(
    'Project-level telemetry configuration that overrides the global settings in ~/.the-codegen-project/config.json. [Read more about telemetry here](https://the-codegen-project.org/docs/telemetry)'
  );

export type ProjectTelemetryConfig = z.infer<typeof zodProjectTelemetryConfig>;

/**
 * TypeScript-specific configuration options.
 * These are only valid when language is 'typescript' (or omitted, defaulting to typescript).
 */
const zodTypeScriptConfigOptions = {
  language: z.literal('typescript').optional().describe(LANGUAGE_DESCRIPTION),
  importExtension: zodImportExtension
};

// =============================================================================
// AsyncAPI Configuration
// =============================================================================

/**
 * TypeScript configuration for AsyncAPI input.
 * When other languages are added, this becomes part of a z.union([typescript, python, ...])
 */
export const zodAsyncAPITypescriptConfig = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('asyncapi').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe(INPUT_PATH_DESCRIPTION),
  auth: zodInputAuth,
  ...zodTypeScriptConfigOptions,
  generators: z
    .array(zodAsyncAPITypeScriptGenerators)
    .describe(GENERATORS_DESCRIPTION),
  telemetry: zodProjectTelemetryConfig
});

// For now, only TypeScript is supported. When adding new languages:
// export const zodAsyncAPICodegenConfiguration = z.union([
//   zodAsyncAPITypescriptConfig,
//   zodAsyncAPIPythonConfig,
// ]);
export const zodAsyncAPICodegenConfiguration = zodAsyncAPITypescriptConfig;

// =============================================================================
// OpenAPI Configuration
// =============================================================================

/**
 * TypeScript configuration for OpenAPI input.
 */
export const zodOpenAPITypescriptConfig = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('openapi').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe(INPUT_PATH_DESCRIPTION),
  auth: zodInputAuth,
  ...zodTypeScriptConfigOptions,
  generators: z
    .array(zodOpenAPITypeScriptGenerators)
    .describe(GENERATORS_DESCRIPTION),
  telemetry: zodProjectTelemetryConfig
});

// For now, only TypeScript is supported
export const zodOpenAPICodegenConfiguration = zodOpenAPITypescriptConfig;

// =============================================================================
// JSON Schema Configuration
// =============================================================================

/**
 * TypeScript configuration for JSON Schema input.
 */
export const zodJsonSchemaTypescriptConfig = z.object({
  $schema: z.string().optional().describe(SCHEMA_DESCRIPTION),
  inputType: z.literal('jsonschema').describe(DOCUMENT_TYPE_DESCRIPTION),
  inputPath: z.string().describe(INPUT_PATH_DESCRIPTION),
  auth: zodInputAuth,
  ...zodTypeScriptConfigOptions,
  generators: z
    .array(zodJsonSchemaTypeScriptGenerators)
    .describe(GENERATORS_DESCRIPTION),
  telemetry: zodProjectTelemetryConfig
});

// For now, only TypeScript is supported
export const zodJsonSchemaCodegenConfiguration = zodJsonSchemaTypescriptConfig;

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
  /**
   * Authentication carried into the input loaders when `documentPath` is
   * a remote URL. Populated from `config.auth` in `realizeGeneratorContext`.
   */
  inputAuth?: InputAuthConfig;
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
  /** Generated files with path and content */
  files: GeneratedFile[];
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Result of the entire generation process
 */
export interface GenerationResult {
  /** Results from each generator */
  generators: GeneratorResult[];
  /** All generated files with path and content */
  files: GeneratedFile[];
  /** Total duration in milliseconds */
  totalDuration: number;
}
