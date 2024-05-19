import { OutputModel, TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina'
import { Logger } from '../../LoggingInterface.js';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { GenericCodegenContext, GenericGeneratorOptions, ParameterRenderType } from '../types.js';

export interface TypescriptParametersGenerator extends GenericGeneratorOptions {
  preset: 'parameters',
  outputPath: string,
  serializationType?: 'json',
  language?: 'typescript'
}

export const defaultTypeScriptParametersOptions: TypescriptParametersGenerator = {
  preset: 'parameters',
  language: 'typescript',
  outputPath: './parameters',
  serializationType: 'json',
  id: 'parameters-typescript'
}

export interface TypescriptParametersContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	asyncapiDocument?: AsyncAPIDocumentInterface,
	generator: TypescriptParametersGenerator
}

export async function generateTypescriptParameters(context: TypescriptParametersContext): Promise<ParameterRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if(inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error("Expected AsyncAPI input, was not given")
  }
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
  for (const channel of asyncapiDocument!.allChannels().all()) {
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
