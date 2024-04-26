import {TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina'
import { GenericCodegenConfiguration } from '../configuration-manager.js';
import { Logger } from '../../LoggingInterface.js';
export interface TypeScriptPayloadGenerator {
  preset: 'payloads',
  outputPath: string,
  serializationType?: 'json',
  language?: 'typescript'
}
export interface TypeScriptPayloadContext extends GenericCodegenConfiguration {
  inputType: 'asyncapi',
	documentPath: string,
	generator: TypeScriptPayloadGenerator
}
export async function generateTypescriptPayload(context: TypeScriptPayloadContext) {
  const {documentPath, generator} = context;
  const modelinaGenerator = new TypeScriptFileGenerator({
    presets: [
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      }
    ]
  });
  const models = await modelinaGenerator.generateToFiles(
    `file://${documentPath}`,
    generator.outputPath,
    { exportType: 'named'},
    true,
  )
  Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
}
