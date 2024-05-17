import { OutputModel } from "@asyncapi/modelina";
import { JavaPayloadGenerator } from "./java/payloads.js";
import { TypeScriptChannelsGenerator } from "./typescript/channels/index.js";
import { TypescriptParametersGenerator } from "./typescript/parameters.js";
import { TypeScriptPayloadGenerator } from "./typescript/payloads.js";


export type PresetTypes = 'payloads' | 'parameters' | 'channels'
export interface LoadArgument { configPath: string, configType: 'esm' }
export type SupportedLanguages = 'typescript' | 'java';
export interface GenericCodegenContext {}
export type Generators = JavaPayloadGenerator | 
	TypeScriptPayloadGenerator | 
	TypescriptParametersGenerator | 
	TypeScriptChannelsGenerator;

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
export type CodegenConfiguration = AsyncAPICodegenConfiguration