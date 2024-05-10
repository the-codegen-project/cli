import {TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina'
import { GenericCodegenConfiguration } from '../configuration-manager.js';
import { Logger } from '../../LoggingInterface.js';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
export interface TypescriptParametersGenerator {
  preset: 'parameters',
  outputPath: string,
  serializationType?: 'json',
  language?: 'typescript'
}
export interface TypescriptParametersContext extends GenericCodegenConfiguration {
  inputType: 'asyncapi',
	asyncapiDocument: AsyncAPIDocumentInterface,
	generator: TypescriptParametersGenerator
}
export async function generateTypescriptParameters(context: TypescriptParametersContext) {
  const {asyncapiDocument, generator} = context;
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
  for (const channel of asyncapiDocument.allChannels().all()) {
    const schemaObj: any = {
      type: 'object',
      'x-modelgen-inferred-name': `${channel.address()}Parameter`,
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {}
    }
    for (const parameter of channel.parameters().all()) {
      schemaObj.properties[parameter.id()] = parameter.schema();
    }
    const models = await modelinaGenerator.generateToFiles(
      schemaObj,
      generator.outputPath,
      { exportType: 'named'},
      true,
    )
    Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
  }
}
