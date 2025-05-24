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

export type PresetTypes =
  | 'payloads'
  | 'parameters'
  | 'headers'
  | 'types'
  | 'channels'
  | 'channel-type'
  | 'custom'
  | 'client';
export interface LoadArgument {
  configPath: string;
  configType: 'esm' | 'json' | 'yaml';
}
export type SupportedLanguages = 'typescript';
export interface GenericCodegenContext {
  dependencyOutputs: Record<string, any>;
}

export const zodAsyncAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptChannelsGenerator,
  zodTypescriptClientGenerator,
  zodTypescriptHeadersGenerator,
  zodTypescriptTypesGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPIGenerators = z.union([
  ...zodAsyncAPITypeScriptGenerators.options
]);

export const zodOpenAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodCustomGenerator
]);

export const zodOpenAPIGenerators = z.union([
  ...zodOpenAPITypeScriptGenerators.options
]);

export type Generators =
  | TypescriptHeadersGenerator
  | TypescriptTypesGenerator
  | TypeScriptPayloadGenerator
  | TypescriptParametersGenerator
  | TypeScriptChannelsGenerator
  | TypeScriptClientGenerator
  | CustomGenerator;

export type GeneratorsInternal =
  | TypeScriptPayloadGeneratorInternal
  | TypescriptParametersGeneratorInternal
  | TypeScriptChannelsGeneratorInternal
  | TypeScriptClientGeneratorInternal
  | TypescriptHeadersGeneratorInternal
  | TypescriptTypesGeneratorInternal
  | CustomGeneratorInternal;

export type RenderTypes =
  | TypeScriptChannelRenderType
  | TypeScriptPayloadRenderType
  | TypeScriptParameterRenderType
  | TypeScriptHeadersRenderType
  | TypeScriptTypesRenderType
  | TypeScriptClientRenderType
  | CustomGenerator;
export interface ParameterRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel | undefined>;
  generator: GeneratorType;
}
export interface HeadersRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel | undefined>;
  generator: GeneratorType;
}
export interface TypesRenderType<GeneratorType> {
  result: string;
  generator: GeneratorType;
}
export interface ChannelPayload {
  messageModel: OutputModel;
  messageType: string;
}
export interface PayloadRenderType<GeneratorType> {
  channelModels: Record<string, ChannelPayload>;
  operationModels: Record<string, ChannelPayload>;
  otherModels: ChannelPayload[];
  generator: GeneratorType;
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

export const zodAsyncAPICodegenConfiguration = z.object({
  $schema: z
    .string()
    .optional()
    .describe(
      'For JSON and YAML configuration files this is used to force the IDE to enable auto completion and validation features'
    ),
  inputType: z.literal('asyncapi').describe('The type of document'),
  inputPath: z.string().describe('The path to the input document'),
  language: z
    .enum(['typescript'])
    .optional()
    .describe(
      'Set the global language for all generators, either one needs to be set'
    ),
  generators: z.array(zodAsyncAPIGenerators)
});

export const zodOpenAPICodegenConfiguration = z.object({
  $schema: z
    .string()
    .optional()
    .describe(
      'For JSON and YAML configuration files this is used to force the IDE to enable auto completion and validation features'
    ),
  inputType: z.literal('openapi').describe('The type of document'),
  inputPath: z.string().describe('The path to the input document '),
  language: z
    .enum(['typescript'])
    .optional()
    .describe(
      'Set the global language for all generators, either one needs to be set'
    ),
  generators: z.array(zodOpenAPIGenerators)
});

export const zodTheCodegenConfiguration = z.discriminatedUnion('inputType', [
  zodAsyncAPICodegenConfiguration,
  zodOpenAPICodegenConfiguration
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
  openapiDocument?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
}
