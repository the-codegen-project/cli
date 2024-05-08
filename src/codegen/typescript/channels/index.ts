import { GenericCodegenConfiguration } from '../../configuration-manager.js';
import { Logger } from '../../../LoggingInterface.js';
export interface TypeScriptChannelsGenerator {
  preset: 'channels',
  outputPath: string,
  language?: 'typescript'
}
export interface TypeScriptChannelsContext extends GenericCodegenConfiguration {
  inputType: 'asyncapi',
	documentPath: string,
	generator: TypeScriptChannelsGenerator
}
export async function generateTypeScriptChannels(context: TypeScriptChannelsContext) {
  
}
