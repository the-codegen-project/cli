/* eslint-disable security/detect-object-injection */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {
  defaultCodegenTypescriptModelinaOptions,
  parameterClassPreset,
  pascalCase
} from '../../../generators/typescript/utils';
import {findNameFromChannel} from '../../../utils';
import {resolveAsyncapiComponentRefs} from '../refs';
import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  TS_DESCRIPTION_PRESET,
  TypeScriptFileGenerator
} from '@asyncapi/modelina';

// Interface for processed parameter schema data
export interface ProcessedParameterSchemaData {
  channelParameters: Record<string, {schema: any; schemaId: string}>;
}

// AsyncAPI parameter processor
export async function processAsyncAPIParameters(
  asyncapiDocument: AsyncAPIDocumentInterface
): Promise<ProcessedParameterSchemaData> {
  const channelParameters: Record<string, {schema: any; schemaId: string}> = {};

  for (const channel of asyncapiDocument.allChannels().all()) {
    const parameters = channel.parameters().all();
    if (parameters.length > 0) {
      const channelName = findNameFromChannel(channel);
      const schemaId = pascalCase(`${channelName}_parameters`);

      const schemaObj: any = {
        type: 'object',
        $id: schemaId,
        $schema: 'http://json-schema.org/draft-07/schema',
        required: [],
        properties: {},
        additionalProperties: false,
        'x-channel-address': channel.address()
      };

      // Component name -> the parameter property the component is inlined at.
      // Only AsyncAPI v2 Parameter Objects carry a `schema`, so this only ever
      // has entries for v2 documents.
      const inlinedTargets = new Map<string, string>();
      for (const parameter of parameters) {
        // `any` because the parser's schema type does not model the
        // `x-parser-schema-id` extension the rewrite keys on.
        const parameterSchema: any = parameter.schema()?.json();
        schemaObj.properties[parameter.id()] = parameterSchema;
        schemaObj.required.push(parameter.id());
        const parserSchemaId = parameterSchema?.['x-parser-schema-id'];
        if (typeof parserSchemaId === 'string') {
          inlinedTargets.set(parserSchemaId, `#/properties/${parameter.id()}`);
        }
      }

      channelParameters[channel.id()] = {
        // Applied once to the assembled root so `#/definitions/...` resolves.
        // Parameter schemas are raw parser JSON rather than
        // `convertToInternalSchema` output; a hoisted component is converted
        // for consistency with the other extraction sites, which only adds
        // Modelina's inferred-name extension on top of the same shape.
        schema: resolveAsyncapiComponentRefs({
          fragment: schemaObj,
          asyncapiDocument,
          inlinedTargets
        }),
        schemaId
      };
    }
  }

  return {
    channelParameters
  };
}

/**
 * Component which contains the parameter unwrapping functionality.
 */
export function unwrap(channelParameters: ConstrainedObjectModel) {
  // Nothing to unwrap if no parameters are used
  if (Object.keys(channelParameters.properties).length === 0) {
    return '';
  }

  // Use channel to iterate over matches as channelParameters.properties might be in incorrect order.

  const parameterReplacement = Object.values(channelParameters.properties).map(
    (parameter) => {
      const variableName = `${parameter.propertyName}Match`;
      return `const ${variableName} = match[sequentialParameters.indexOf('{${parameter.unconstrainedPropertyName}}')+1];
      if(${variableName} && ${variableName} !== '') {
        parameters.${parameter.propertyName} = ${variableName} as any
      } else {
        throw new Error(\`Parameter: '${parameter.propertyName}' is not valid in ${channelParameters.name}. Aborting parameter extracting! \`) 
      }`;
    }
  );

  const parameterInitializer = Object.values(channelParameters.properties)
    .filter(
      (parameter) => parameter.property.options.const?.value === undefined
    )
    .map((parameter) => {
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
    });

  return `const parameters = new ${channelParameters.name}({${parameterInitializer.join(', ')}});
const match = msgSubject.match(regex);
const sequentialParameters: string[] = channel.match(/\\{(\\w+)\\}/g) || [];

if (match) {
  ${parameterReplacement.join('\n')}
} else {
  throw new Error(\`Unable to find parameters in channel/topic, topic was \${channel}\`)
}
return parameters;`;
}

/**
 * Generate additional content for AsyncAPI channel parameter classes
 */
function generateAsyncAPIParameterMethods(model: ConstrainedObjectModel) {
  const parameters = Object.entries(model.properties).map(([, parameter]) => {
    return `channel = channel.replace(/\\{${parameter.unconstrainedPropertyName}\\}/g, this.${parameter.propertyName})`;
  });

  return `/**
 * Realize the channel/topic with the parameters added to this class.
 */
public getChannelWithParameters(channel: string) {
  ${parameters.length > 0 ? parameters.join(';\n  ') : '// No parameters to replace'};
  return channel;
}
  
public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): ${model.type} {
  ${unwrap(model)}
}`;
}

export function createAsyncAPIGenerator() {
  return new TypeScriptFileGenerator({
    ...defaultCodegenTypescriptModelinaOptions,
    enumType: 'union',
    useJavascriptReservedKeywords: false,
    presets: [
      TS_DESCRIPTION_PRESET,
      parameterClassPreset(generateAsyncAPIParameterMethods)
    ]
  });
}
