import {JAVA_JACKSON_PRESET, JavaFileGenerator} from '@asyncapi/modelina';
import {Logger} from '../../../LoggingInterface';
import {GenericCodegenContext} from '../../types';
import {z} from 'zod';

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
  documentPath: string;
  generator: JavaPayloadGenerator;
}

export const defaultJavaPayloadGenerator: JavaPayloadGenerator =
  zodJavaPayloadGenerator.parse({});

export async function generateJavaPayload(context: JavaPayloadContext) {
  const {documentPath, generator} = context;
  const modelinaGenerator = new JavaFileGenerator({
    presets: [
      {
        preset: JAVA_JACKSON_PRESET
      }
    ]
  });
  const models = await modelinaGenerator.generateToFiles(
    `file://${documentPath}`,
    generator.outputPath,
    {packageName: generator.packageName},
    true
  );
  Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
}
