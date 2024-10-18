import {OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptChannelsGenerator,
  zodTypescriptChannelsGenerator
} from './generators/typescript/channels/index';
import {
  TypescriptParametersGenerator,
  zodTypescriptParametersGenerator
} from './generators/typescript/parameters';
import {
  TypeScriptPayloadGenerator,
  zodTypeScriptPayloadGenerator
} from './generators/typescript/payloads';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {CustomGenerator, zodCustomGenerator} from './generators/generic/custom';
import {z} from 'zod';
export type PresetTypes = 'payloads' | 'parameters' | 'channels' | 'custom';
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
  zodCustomGenerator
]);

export const zodAsyncAPIGenerators = z.union([
  ...zodAsyncAPITypeScriptGenerators.options
]);

export type Generators =
  | TypeScriptPayloadGenerator
  | TypescriptParametersGenerator
  | TypeScriptChannelsGenerator
  | CustomGenerator;

export interface GenericGeneratorOptions {
  id?: string;
  preset: PresetTypes;
  dependencies?: string[];
}

export interface ParameterRenderType {
  channelModels: Record<string, OutputModel | undefined>;
  generator: TypescriptParametersGenerator;
}
export interface ChannelPayload {messageModel: OutputModel, messageType: string}
export interface PayloadRenderType<GeneratorType> {
  channelModels: Record<string, ChannelPayload>;
  generator: GeneratorType;
}
export interface SingleFunctionRenderType {
  functionName: string;
  code: string;
  dependencies: string[];
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
  configuration: TheCodegenConfigurationInternal;
  configFilePath: string;
  documentPath: string;
  asyncapiDocument?: AsyncAPIDocumentInterface;
}
