import {TS_COMMON_PRESET, TypeScriptFileGenerator} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {generateAsyncAPIPayloads} from '../helpers/payloads';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions} from './utils';

export const zodTypeScriptPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().default('src/__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript'),
  model: z
    .enum(['class', 'interface'])
    .optional()
    .default('class')
    .describe(
      'By default all payloads are generated as class types, but in some cases interfaces might be more prudent.'
    ),
  enum: z
    .enum(['enum', 'union'])
    .optional()
    .default('enum')
    .describe(
      'By default all payloads enum types are generated as separate enum types, but in some cases a simple union type might be more prudent.'
    ),
  map: z
    .enum(['indexedObject', 'map', 'record'])
    .optional()
    .default('record')
    .describe(''),
  moduleSystem: z.enum(['esm', 'cjs']).optional().default('esm').describe(''),
  useForJavaScript: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'By default we assume that the models might be transpiled to JS, therefore JS restrictions will be applied by default.'
    ),
  rawPropertyNames: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Use raw property names instead of constrained ones, where you most likely need to access them with obj["propertyName"] instead of obj.propertyName'
    )
});
export type TypeScriptPayloadGenerator = z.infer<
  typeof zodTypeScriptPayloadGenerator
>;

export const defaultTypeScriptPayloadGenerator: TypeScriptPayloadGenerator =
  zodTypeScriptPayloadGenerator.parse({});

export interface TypeScriptPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptPayloadGenerator;
}

export async function generateTypescriptPayload(
  context: TypeScriptPayloadContext
): Promise<PayloadRenderType<TypeScriptPayloadGenerator>> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }

  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    presets: [
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      }
    ],
    enumType: generator.enum,
    mapType: generator.map,
    modelType: generator.model,
    moduleSystem: generator.moduleSystem.toUpperCase() as any,
    rawPropertyNames: generator.rawPropertyNames,
    useJavascriptReservedKeywords: generator.useForJavaScript
  });
  return generateAsyncAPIPayloads(
    asyncapiDocument!,
    (input) =>
      modelinaGenerator.generateToFiles(
        input,
        generator.outputPath,
        {exportType: 'named'},
        true
      ),
    generator
  );
}
