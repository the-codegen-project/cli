import {OutputModel, TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina';
import { Logger } from '../../../LoggingInterface';
import { GenericCodegenContext, GenericGeneratorOptions, PayloadRenderType } from '../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
export interface TypeScriptPayloadGenerator extends GenericGeneratorOptions {
  preset: 'payloads',
  outputPath: string,
  serializationType?: 'json',
  language?: 'typescript'
}

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGenerator = {
  preset: 'payloads',
  language: 'typescript',
  outputPath: './payloads',
  serializationType: 'json',
  id: 'payloads-typescript'  
};

export interface TypeScriptPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	asyncapiDocument?: AsyncAPIDocumentInterface,
	generator: TypeScriptPayloadGenerator
}

export async function generateTypescriptPayload(context: TypeScriptPayloadContext): Promise<PayloadRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error("Expected AsyncAPI input, was not given");
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
  const returnType: Record<string, OutputModel> = {};
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const schemaObj: any = {
      type: 'object',
      'x-modelgen-inferred-name': `${channel.address()}Payload`,
      $schema: 'http://json-schema.org/draft-07/schema',
      oneOf: []
    };
    for (const message of channel.messages().all()) {
      schemaObj.oneOf.push({
        ...message.payload()?.json(),
        'x-modelgen-inferred-name': `${message.name()}`,
      });
    }

    const models = await modelinaGenerator.generateToFiles(
      schemaObj,
      generator.outputPath,
      { exportType: 'named'},
      true,
    );
    returnType[channel.id()] = models[0];
    Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
  }
  return {
    channelModels: returnType
  };
}
