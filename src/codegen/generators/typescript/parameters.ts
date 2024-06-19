import {
  OutputModel,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';
import {Logger} from '../../../LoggingInterface';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  GenericCodegenContext,
  GenericGeneratorOptions,
  ParameterRenderType
} from '../../types';
import {z} from 'zod';

export interface TypescriptParametersGenerator extends GenericGeneratorOptions {
  preset: 'parameters';
  outputPath: string;
  serializationType?: 'json';
  language?: 'typescript';
}

export const zodTypescriptParametersGenerator = z.object({
  id: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  preset: z.literal('parameters'),
  outputPath: z.string(),
  serializationType: z.literal('json').optional(),
  language: z.literal('typescript').optional()
});

export const defaultTypeScriptParametersOptions: TypescriptParametersGenerator =
  {
    preset: 'parameters',
    language: 'typescript',
    outputPath: 'src/__gen__/parameters',
    serializationType: 'json',
    id: 'parameters-typescript',
    dependencies: []
  };

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
        $id: `${channel.id()}_parameters`,
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
      Logger.info(schemaObj);
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
