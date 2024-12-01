import {OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptChannelsGenerator,
  TypeScriptChannelsGeneratorInternal,
  zodTypescriptChannelsGenerator
} from './generators/typescript/channels/index';
import {
  TypescriptParametersGenerator,
  TypescriptParametersGeneratorInternal,
  zodTypescriptParametersGenerator
} from './generators/typescript/parameters';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadGeneratorInternal,
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
  zodTypescriptHeadersGenerator
} from './generators/typescript/headers';
export type PresetTypes =
  | 'payloads'
  | 'parameters'
  | 'headers'
  | 'channels'
  | 'custom'
  | 'client';
export interface LoadArgument {
  configPath: string;
  configType: 'esm' | 'json' | 'yaml';
}
export type SupportedLanguages = 'typescript';
export interface GenericCodegenContext {
  dependencyOutputs?: Record<string, any>;
}

export const zodAsyncAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptChannelsGenerator,
  zodTypescriptClientGenerator,
  zodTypescriptHeadersGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPIGenerators = z.union([
  ...zodAsyncAPITypeScriptGenerators.options
]);

export type Generators =
  | TypescriptHeadersGenerator
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
  | CustomGeneratorInternal;

export interface ParameterRenderType {
  channelModels: Record<string, OutputModel | undefined>;
  generator: TypescriptParametersGenerator;
}
export interface HeadersRenderType {
  channelModels: Record<string, OutputModel | undefined>;
  generator: TypescriptHeadersGenerator;
}
export interface ChannelPayload {
  messageModel: OutputModel;
  messageType: string;
}
export interface PayloadRenderType<GeneratorType> {
  channelModels: Record<string, ChannelPayload>;
  otherModels: ChannelPayload[];
  generator: GeneratorType;
}
export interface SingleFunctionRenderType {
  functionName: string;
  code: string;
  dependencies: string[];
  functionType: string;
}

export const zodAsyncAPICodegenConfiguration = z.object({
  $schema: z.string().optional(),
  inputType: z.literal('asyncapi'),
  inputPath: z.string(),
  language: z.enum(['typescript']).optional(),
  generators: z.array(zodAsyncAPIGenerators)
});

export const zodTheCodegenConfiguration = z.discriminatedUnion('inputType', [
  zodAsyncAPICodegenConfiguration
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
}
