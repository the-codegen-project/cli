import { TS_COMMON_PRESET, TypeScriptFileGenerator } from '@asyncapi/modelina';
import { GenericCodegenContext, GenericGeneratorOptions, PayloadRenderType } from '../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { generateAsyncAPIPayloads } from '../helpers/payloads';
import { z } from 'zod';
export interface TypeScriptPayloadGenerator extends GenericGeneratorOptions {
  preset: 'payloads',
  outputPath: string,
  serializationType?: 'json',
  language?: 'typescript'
}

export const zodTypeScriptPayloadGenerator = z.object({
	id: z.string().optional(),
	dependencies: z.array(z.string()).optional(),
  preset: z.literal('payloads'),
  outputPath: z.string(),
  serializationType: z.literal('json').optional(),
  language: z.literal('typescript').optional()
});

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGenerator = {
  preset: 'payloads',
  language: 'typescript',
  outputPath: './payloads',
  serializationType: 'json',
  id: 'payloads-typescript',
  dependencies: []
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
    ),
    generator
  );
}
