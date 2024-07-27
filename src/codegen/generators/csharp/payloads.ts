import {
  CSHARP_JSON_SERIALIZER_PRESET,
  CSHARP_NEWTONSOFT_SERIALIZER_PRESET,
  CSharpFileGenerator
} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {generateAsyncAPIPayloads} from '../helpers/payloads';
import {z} from 'zod';

export const zodCsharpPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-csharp'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().default('__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  serializationLibrary: z.enum(['newtonsoft', 'json']).optional().default('newtonsoft'),
  language: z.literal('csharp').optional().default('csharp'),
  namespace: z.string().optional().default('__gen__.payloads')
});
export type CsharpPayloadGenerator = z.infer<typeof zodCsharpPayloadGenerator>;

export const defaultCsharpPayloadGenerator: CsharpPayloadGenerator =
  zodCsharpPayloadGenerator.parse({});

export interface CsharpPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: CsharpPayloadGenerator;
}

export async function generateCsharpPayload(
  context: CsharpPayloadContext
): Promise<PayloadRenderType<CsharpPayloadGenerator>> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  const presets = [];
  if (context.generator.serializationLibrary === 'json') {
    presets.push(CSHARP_JSON_SERIALIZER_PRESET);
  } else if (context.generator.serializationLibrary === 'newtonsoft') {
    presets.push(CSHARP_NEWTONSOFT_SERIALIZER_PRESET);
  }
  const modelinaGenerator = new CSharpFileGenerator({
    presets
  });
  return generateAsyncAPIPayloads(
    asyncapiDocument!,
    (input) =>
      modelinaGenerator.generateToFiles(
        input,
        generator.outputPath,
        {namespace: generator.namespace},
        true
      ),
    generator
  );
}
