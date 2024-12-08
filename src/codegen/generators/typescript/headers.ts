import {
  OutputModel,
  TS_COMMON_PRESET,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, HeadersRenderType} from '../../types';
import {z} from 'zod';
import {defaultCodegenTypescriptModelinaOptions, pascalCase} from './utils';

export const zodTypescriptHeadersGenerator = z.object({
  id: z.string().optional().default('headers-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('headers').default('headers'),
  outputPath: z.string().default('src/__gen__/headers'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypescriptHeadersGenerator = z.input<
  typeof zodTypescriptHeadersGenerator
>;
export type TypescriptHeadersGeneratorInternal = z.infer<
  typeof zodTypescriptHeadersGenerator
>;

export const defaultTypeScriptHeadersOptions: TypescriptHeadersGeneratorInternal =
  zodTypescriptHeadersGenerator.parse({});

export interface TypescriptHeadersContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypescriptHeadersGeneratorInternal;
}

export type TypeScriptHeadersRenderType = HeadersRenderType<TypescriptHeadersGeneratorInternal>;

export async function generateTypescriptHeaders(
  context: TypescriptHeadersContext
): Promise<TypeScriptHeadersRenderType> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  const modelinaGenerator = new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    presets: [
      TS_DESCRIPTION_PRESET,
      {
        preset: TS_COMMON_PRESET,
        options: {
          marshalling: true
        }
      }
    ]
  });
  const returnType: Record<string, OutputModel | undefined> = {};
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const messages = channel.messages().all();
    for (const message of messages) {
      if (message.hasHeaders()) {
        const schemaObj: any = {
          additionalProperties: false,
          ...message.headers()?.json(),
          type: 'object',
          $id: pascalCase(`${message.id()}_headers`),
          $schema: 'http://json-schema.org/draft-07/schema'
        };
        const models = await modelinaGenerator.generateToFiles(
          schemaObj,
          generator.outputPath,
          {exportType: 'named'},
          true
        );
        returnType[channel.id()] = models[0];
      } else {
        returnType[channel.id()] = undefined;
      }
    }
  }

  return {
    channelModels: returnType,
    generator
  };
}
