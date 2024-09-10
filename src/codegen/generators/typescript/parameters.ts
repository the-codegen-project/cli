import {
  OutputModel,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, ParameterRenderType} from '../../types';
import {z} from 'zod';
import {findNameFromChannel} from '../../utils';
import {defaultCodegenTypescriptModelinaOptions, pascalCase} from './utils';

export const zodTypescriptParametersGenerator = z.object({
  id: z.string().optional().default('parameters-typescript'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('parameters').default('parameters'),
  outputPath: z.string().default('src/__gen__/parameters'),
  serializationType: z.literal('json').optional().default('json'),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypescriptParametersGenerator = z.infer<
  typeof zodTypescriptParametersGenerator
>;

export const defaultTypeScriptParametersOptions: TypescriptParametersGenerator =
  zodTypescriptParametersGenerator.parse({});

export interface TypescriptParametersContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypescriptParametersGenerator;
}

export async function generateTypescriptParameters(
  context: TypescriptParametersContext
): Promise<ParameterRenderType> {
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
        class: {
          additionalContent: ({content, model, renderer}) => {
            const parameters = Object.entries(model.properties).map(
              ([, parameter]) => {
                return `channel = channel.replace(/\\{${parameter.unconstrainedPropertyName}\\}/g, this.${parameter.propertyName})`;
              }
            );
            return `${content}
/**
 * Realize the channel/topic with the parameters added to this class.
 */
public getChannelWithParameters(channel: string) {
  ${renderer.renderBlock(parameters)};
  return channel;
}`;
          }
        }
      }
    ]
  });
  const returnType: Record<string, OutputModel | undefined> = {};
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const parameters = channel.parameters().all();
    if (parameters.length > 0) {
      const schemaObj: any = {
        type: 'object',
        $id: pascalCase(`${findNameFromChannel(channel)}_parameters`),
        $schema: 'http://json-schema.org/draft-07/schema',
        required: [],
        properties: {},
        additionalProperties: false,
        'x-channel-address': channel.address()
      };
      for (const parameter of channel.parameters().all()) {
        schemaObj.properties[parameter.id()] = parameter.schema()?.json();
        schemaObj.required.push(parameter.id());
      }
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

  return {
    channelModels: returnType,
    generator
  };
}
