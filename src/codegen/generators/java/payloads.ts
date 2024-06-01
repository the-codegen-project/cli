import { JAVA_JACKSON_PRESET, JavaFileGenerator } from '@asyncapi/modelina';
import { Logger } from '../../../LoggingInterface';
import { GenericCodegenContext, GenericGeneratorOptions } from '../../types';
export interface JavaPayloadGenerator extends GenericGeneratorOptions {
  preset: 'payloads',
  outputPath: string,
  serializationType?: 'json',
  packageName: string,
  language?: 'java'
}
export interface JavaPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	documentPath: string,
	generator: JavaPayloadGenerator
}

export const defaultJavaPayloadGenerator: JavaPayloadGenerator = {
  preset: 'payloads',
  language: 'java',
  outputPath: './target/generated-sources/the/codegen/project',
  packageName: 'the.codegen.project',
  id: 'payloads-java'
};
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
    true,
  );
  Logger.info(`Generated ${models.length} models to ${generator.outputPath}`);
}
