import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
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

export type TypescriptParametersGenerator = z.input<
  typeof zodTypescriptParametersGenerator
>;
export type TypescriptParametersGeneratorInternal = z.infer<
  typeof zodTypescriptParametersGenerator
>;

export const defaultTypeScriptParametersOptions: TypescriptParametersGenerator =
  zodTypescriptParametersGenerator.parse({});

export interface TypescriptParametersContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypescriptParametersGeneratorInternal;
}

/**
 * Component which contains the parameter unwrapping functionality.
 * 
 * 
 * Example
const regex = /^adeo-([^.]*)-case-study-COSTING-REQUEST-([^.]*)$/;
const match = channel.match(regex);

const parameters = new CostingRequestChannelParameters({env: "dev", version: ''});
if (match) {
  const envMatch = match.at(1)
  if(envMatch && envMatch !== '') {
    parameters.env = envMatch as any
  } else {
    throw new Error(`Parameter: 'env' is not valid. Abort! `) 
  }
  const versionMatch = match.at(2)
  if(versionMatch && versionMatch !== '') {
    parameters.version = versionMatch as any
  } else {
    throw new Error(`Parameter: 'version' is not valid. Abort! `) 
  }
} else {
  throw new Error(`Unable to find parameters in channe/topic, topic was ${channel}`)
}
return parameters;
 * 
 */
export function unwrap(
  channelParameters: ConstrainedObjectModel
) {
  // Nothing to unwrap if no parameters are used
  if (Object.keys(channelParameters.properties).length === 0) {
    return '';
  }

  // Use channel to iterate over matches as channelParameters.properties might be in incorrect order.

  const parameterReplacement = Object.values(channelParameters.properties).map(
    (parameter) => {
      const variableName = `${parameter.propertyName}Match`;
      return `const ${variableName} = match[sequentialParameters.indexOf('{${parameter.unconstrainedPropertyName}}')];
      if(${variableName} && ${variableName} !== '') {
        parameters.${parameter.propertyName} = ${variableName} as any
      } else {
        throw new Error(\`Parameter: '${parameter.propertyName}' is not valid. Abort! \`) 
      }`;
    }
  );

  const parameterInitializer = Object.values(channelParameters.properties).map(
    (parameter) => {
      if (parameter.property.options.isNullable) {
        return `${parameter.propertyName}: null`;
      }
      const property = parameter.property;
      if (
        property instanceof ConstrainedReferenceModel &&
        property.ref instanceof ConstrainedEnumModel
      ) {
        return `${parameter.propertyName}: ${property.ref.values[0].value}`;
      }
      return `${parameter.propertyName}: ''`;
    }
  );

  return `const parameters = new ${channelParameters.name}({${parameterInitializer.join(', ')}});
const match = channel.match(regex);
const sequentialParameters = channel.match(/\\{(\\w+)\\}/g)?.map(param => param.slice(1, -1)) || [];

if (match) {
  ${parameterReplacement.join('\n')}
} else {
  throw new Error(\`Unable to find parameters in channel/topic, topic was \${channel}\`)
}
return parameters;`;
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
}
  
public static createFromChannel(channel: string, regex: RegExp): ${model.type} {
  ${unwrap(model)}
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
