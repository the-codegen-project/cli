import { TS_COMMON_PRESET, TypeScriptFileGenerator } from '@asyncapi/modelina';
import { GenericCodegenContext, GenericGeneratorOptions, PayloadRenderType } from '../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { generateAsyncAPIPayloads } from '../helpers/payloads';
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
  return generateAsyncAPIPayloads(asyncapiDocument!, (input) => modelinaGenerator.generateToFiles(
      input,
      generator.outputPath,
      { exportType: 'named'},
      true,
    )
  );
}
