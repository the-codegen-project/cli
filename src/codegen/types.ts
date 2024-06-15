import { OutputModel } from "@asyncapi/modelina";
import { JavaPayloadGenerator, zodJavaPayloadGenerator } from "./generators/java/payloads";
import { TypeScriptChannelsGenerator, zodTypescriptChannelsGenerator } from "./generators/typescript/channels/index";
import { TypescriptParametersGenerator, zodTypescriptParametersGenerator } from "./generators/typescript/parameters";
import { TypeScriptPayloadGenerator, zodTypeScriptPayloadGenerator } from "./generators/typescript/payloads";
import { AsyncAPIDocumentInterface } from "@asyncapi/parser";
import { CustomGenerator } from "./generators/generic/custom";
import { z } from 'zod';
export type PresetTypes = 'payloads' | 'parameters' | 'channels' | 'custom';
export interface LoadArgument { configPath: string, configType: 'esm' | 'json' | 'yaml' };
export type SupportedLanguages = 'typescript' | 'java';
export interface GenericCodegenContext {
	dependencyOutputs?: Record<string, any>,
}

export const zodTypeScriptGenerators = z.discriminatedUnion("preset", [
  zodTypeScriptPayloadGenerator,
  zodTypescriptParametersGenerator,
  zodTypescriptChannelsGenerator
]);
export const zodJavaGenerators = z.discriminatedUnion("preset", [
  zodJavaPayloadGenerator
]);

export const zodGenerators = z.union([
  ...zodTypeScriptGenerators.options,
  ...zodJavaGenerators.options,
]);

export type Generators = JavaPayloadGenerator | 
	TypeScriptPayloadGenerator | 
	TypescriptParametersGenerator | 
	TypeScriptChannelsGenerator | 
	CustomGenerator;

export interface GenericGeneratorOptions {
  id?: string,
  preset: PresetTypes,
  dependencies?: string[]
}

export interface ParameterRenderType {
  channelModels: Record<string, OutputModel | undefined>,
  generator: TypescriptParametersGenerator
}
export interface PayloadRenderType {
  channelModels: Record<string, OutputModel>,
  generator: TypeScriptPayloadGenerator
}
export interface SingleFunctionRenderType {
  functionName: string,
  code: string,
  dependencies: string []
}
export interface AsyncAPICodegenConfiguration {
	inputType: 'asyncapi',
	inputPath: string,
	language?: SupportedLanguages
	generators: Generators[]
}
export const zodAsyncAPICodegenConfiguration = z.object({
  inputType: z.literal('asyncapi'),
  inputPath: z.string(),
  generators: z.array(zodGenerators)
});
export const zodTheCodegenConfiguration = z.discriminatedUnion('inputType', [
  zodAsyncAPICodegenConfiguration
]);

export type TheCodegenConfiguration = AsyncAPICodegenConfiguration

export interface RunGeneratorContext {
	configuration: TheCodegenConfiguration,
	configFilePath: string,
	documentPath: string,
  asyncapiDocument?: AsyncAPIDocumentInterface
}
