import {OutputModel} from '@asyncapi/modelina';
import {
  JavaPayloadGenerator,
  zodJavaPayloadGenerator
} from './generators/java/payloads';
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
import { CsharpPayloadGenerator, zodCsharpPayloadGenerator } from './generators/csharp/payloads';
export type PresetTypes = 'payloads' | 'parameters' | 'channels' | 'custom';
export interface LoadArgument {
  configPath: string;
  configType: 'esm' | 'json' | 'yaml';
}
export type SupportedLanguages = 'typescript' | 'java' | 'csharp';
export interface GenericCodegenContext {
  dependencyOutputs?: Record<string, any>;
}

export const zodAsyncAPITypeScriptGenerators = z.discriminatedUnion('preset', [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptChannelsGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPIJavaGenerators = z.discriminatedUnion('preset', [
  zodJavaPayloadGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPICsharpGenerators = z.discriminatedUnion('preset', [
  zodCsharpPayloadGenerator,
  zodCustomGenerator
]);

export const zodAsyncAPIGenerators = z.union([
  ...zodAsyncAPITypeScriptGenerators.options,
  ...zodAsyncAPIJavaGenerators.options,
  ...zodAsyncAPICsharpGenerators.options
]);

export type Generators =
  | JavaPayloadGenerator
  | CsharpPayloadGenerator
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
export interface PayloadRenderType<GeneratorType> {
  channelModels: Record<string, OutputModel>;
  generator: GeneratorType;
}
export interface SingleFunctionRenderType {
  functionName: string;
  code: string;
  dependencies: string[];
}

export const zodAsyncAPICodegenConfiguration = z.object({
  inputType: z.literal('asyncapi'),
  inputPath: z.string(),
  language: z.enum(['typescript', 'java', 'csharp']).optional(),
  generators: z.array(zodAsyncAPIGenerators)
});

export const zodTheCodegenConfiguration = z.discriminatedUnion('inputType', [
  zodAsyncAPICodegenConfiguration
]);

export type TheCodegenConfiguration = z.infer<
  typeof zodTheCodegenConfiguration
>;

export interface RunGeneratorContext {
  configuration: TheCodegenConfiguration;
  configFilePath: string;
  documentPath: string;
  asyncapiDocument?: AsyncAPIDocumentInterface;
}
