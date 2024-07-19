import {JAVA_JACKSON_PRESET, JavaFileGenerator} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {z} from 'zod';
import {generateAsyncAPIPayloads} from '../helpers/payloads';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';

export const zodJavaPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-java'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z
    .string()
    .default('./target/generated-sources/the/codegen/project'),
  packageName: z.string().default('the.codegen.project'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('java').optional().default('java')
});

export type JavaPayloadGenerator = z.infer<typeof zodJavaPayloadGenerator>;

export interface JavaPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: JavaPayloadGenerator;
}

export const defaultJavaPayloadGenerator: JavaPayloadGenerator =
  zodJavaPayloadGenerator.parse({});

export async function generateJavaPayload(
  context: JavaPayloadContext
): Promise<PayloadRenderType<JavaPayloadGenerator>> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }

  const modelinaGenerator = new JavaFileGenerator({
    presets: [JAVA_JACKSON_PRESET]
  });
  return generateAsyncAPIPayloads(
    asyncapiDocument!,
    (input) =>
      modelinaGenerator.generateToFiles(
        input,
        generator.outputPath,
        {packageName: generator.packageName},
        true
      ),
    generator
  );
}
