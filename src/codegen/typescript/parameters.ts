import {ConstrainedObjectModel, OutputModel, TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina'
import { GenericCodegenConfiguration } from '../configuration-manager.js';
import { Logger } from '../../LoggingInterface.js';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
export interface ParameterRenderType {
  channelModels: Record<string, OutputModel>
}
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
export async function generateTypescriptParameters(context: TypescriptParametersContext): Promise<ParameterRenderType> {
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
  const returnType: Record<string, OutputModel> = {}
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
    returnType[channel.id()] = models[0];
    Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
  }
  return {
    channelModels: returnType
  };
}
