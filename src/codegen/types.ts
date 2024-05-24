import { OutputModel } from "@asyncapi/modelina";
import { JavaPayloadGenerator } from "./java/payloads";
import { TypeScriptChannelsGenerator } from "./typescript/channels/index";
import { TypescriptParametersGenerator } from "./typescript/parameters";
import { TypeScriptPayloadGenerator } from "./typescript/payloads";
import { AsyncAPIDocumentInterface } from "@asyncapi/parser";
import { CustomGenerator } from "./generic/custom";

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
  dependencies?: PresetTypes[]
}
export interface ParameterRenderType {
  channelModels: Record<string, OutputModel>
}
export interface PayloadRenderType {
  channelModels: Record<string, OutputModel>
}
export interface SingleFunctionRenderType {
  functionName: string,
  code: string
}
export interface AsyncAPICodegenConfiguration extends GenericCodegenContext {
	inputType: 'asyncapi',
	inputPath: string,
	language?: SupportedLanguages
	generators: Generators[]
}
export type TheCodegenConfiguration = AsyncAPICodegenConfiguration

export interface RunGeneratorContext {
	configuration: TheCodegenConfiguration,
	filePath: string,
	documentPath: string,
  asyncapiDocument?: AsyncAPIDocumentInterface
}
