import { OutputModel } from "@asyncapi/modelina";
import { JavaPayloadGenerator } from "./generators/java/payloads";
import { TypeScriptChannelsGenerator } from "./generators/typescript/channels/index";
import { TypescriptParametersGenerator } from "./generators/typescript/parameters";
import { TypeScriptPayloadGenerator } from "./generators/typescript/payloads";
import { AsyncAPIDocumentInterface } from "@asyncapi/parser";
import { CustomGenerator } from "./generators/generic/custom";

export type PresetTypes = 'payloads' | 'parameters' | 'channels' | 'custom'
export interface LoadArgument { configPath: string, configType: 'esm' }
export type SupportedLanguages = 'typescript' | 'java';
export interface GenericCodegenContext {
	dependencyOutputs?: Record<string, any>,
}
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
export type TheCodegenConfiguration = AsyncAPICodegenConfiguration

export interface RunGeneratorContext {
	configuration: TheCodegenConfiguration,
	configFilePath: string,
	documentPath: string,
  asyncapiDocument?: AsyncAPIDocumentInterface
}
