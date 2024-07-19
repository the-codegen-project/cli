import {
  CSHARP_JSON_SERIALIZER_PRESET,
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
  outputPath: z.string().default('src/__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('csharp').optional().default('csharp'),
  namespace: z.string().optional().default('the.codegen.project')
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

  const modelinaGenerator = new CSharpFileGenerator({
    presets: [CSHARP_JSON_SERIALIZER_PRESET]
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
