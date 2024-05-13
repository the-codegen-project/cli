import { ConstrainedObjectModel } from "@asyncapi/modelina";
import * as changeCase from "change-case";

/**
 * Component which contains the parameter unwrapping functionality.
 * 
 * 
 * Example
  const unmodifiedChannel = `streetlight.{streetlight_id}.command.turnon`;
  const channel = msg.subject;
  const streetlightIdSplit = unmodifiedChannel.split("{streetlight_id}");
  const splits = [
    streetlightIdSplit[0],
    streetlightIdSplit[1]
  ];
  channel = channel.substring(splits[0].length);
  const streetlightIdEnd = channel.indexOf(splits[1]);
  const streetlightIdParam = "" + channel.substring(0, streetlightIdEnd);
 * 
 */
export function unwrap(channelName: string, channelParameters: ConstrainedObjectModel) {
  //Nothing to unwrap if no parameters are used
  if (Object.keys(channelParameters.properties).length === 0) {
    return '';
  }  
  //Retrieve the actual parameters from the received NATS topic using the split array
  let initiateParameters = Object.entries(channelParameters.properties).map(([parameterName, _], index) => {
    const formattedParameterName = camelCase(parameterName);
    return `let ${formattedParameterName}Param = ''`;
  });

  //Retrieve the actual parameters from the received NATS topic using the split array
  let parameterReplacement = Object.entries(channelParameters.properties).map(([parameterName, _], index) => {
    const formattedParameterName = camelCase(parameterName);
    return `${formattedParameterName}Param = match[${index+1}];`;
  });
  const topicWithWildcardGroup = channelName.replace(/\{[^}]+\}/g, "([^.]*)");
  const regexMatch = `/^${topicWithWildcardGroup}$/`;

  return `const regex = ${regexMatch};
const match = msg.subject.match(regex);

${initiateParameters.join('\n')}
if (match) {
  ${parameterReplacement.join('\n')}
} else {
  console.error(\`Was not able to retrieve parameters, ignoring message. Subject was: \${msg.subject}\`);
  return;
}`;
}

/**
 * Cast JSON schema variable to typescript type
 * 
 * @param {string} jsonSchemaType 
 * @param {string} variableToCast 
 */
export function castToTsType(jsonSchemaType: string, variableToCast: string) {
  switch (jsonSchemaType.toLowerCase()) {
  case 'string':
    return `"" + ${variableToCast}`;
  case 'integer':
  case 'number':
    return `Number(${variableToCast})`;
  case 'boolean':
    return `Boolean(${variableToCast})`;
  default: throw new Error(`Parameter type not supported - ${jsonSchemaType}`);
  }
}

/**
 * Realize parameters without using types and without trailing comma
 * 
 * @param {Object.<string, ChannelParameter>} parameters 
 * @returns 
 */
export function realizeParametersForChannelWithoutType(parameters: ConstrainedObjectModel) {
  let returnString = '';
  for (const paramName in Object.keys(parameters.properties)) {
    returnString += `${paramName},`;
  }
  if (returnString.length >= 1) {
    returnString = returnString.slice(0, -1);
  }
  return returnString;
}
  
/**
 * Realize parameters for channels for function definitions in typescript
 * 
 * @param {Object.<string, ChannelParameter>} channelParameters parameters to realize
 * @param {boolean} required optional or required
 */
export function realizeParametersForChannelWrapper(channelParameters: ConstrainedObjectModel, required = true) {
  return Object.keys(channelParameters.properties).length ? `,${realizeParametersForChannel(channelParameters, required)}` : '';
}

/**
  * Realize parameters using types without trailing comma
  * @param {Object.<string, ChannelParameter>} channelParameters parameters to realize
  * @param {boolean} required optional or required
  */
export function realizeParametersForChannel(channelParameters: ConstrainedObjectModel, required = true) {
  let returnString = '';
  for (const parameter of Object.values(channelParameters.properties)) {
    returnString += `${realizeParameterForChannelWithType(parameter.propertyName, parameter.property.type, required)  },`;
  }
  if (returnString.length >= 1) {
    returnString = returnString.slice(0, -1);
  }
  return returnString;
}

/**
 * Realize a single parameter with its type 
 * 
 * @param {string} parameterName parameter name to use as
 * @param {ChannelParameter} parameter which contains the schema 
 * @param {boolean} required should it be optional or required
 */
function realizeParameterForChannelWithType(parameterName: string, parameterType: string, required = true) {
  const requiredType = !required ? '?' : '';
  return `${parameterName}${requiredType}: ${parameterType})}`;
}

/**
 * Render channel parameters for JSDoc
 * 
 * @param {Object.<string, ChannelParameter>} channelParameters to render
 */
export function renderJSDocParameters(channelParameters: ConstrainedObjectModel) {
  return Object.keys(channelParameters.properties).map((paramName) => {
    return `* @param ${paramName} parameter to use in topic`;
  }).join('\n');
}

/**
 * Convert RFC 6570 URI with parameters to NATS topic. 
 */
export function realizeChannelName(channelName: string, parameters?: ConstrainedObjectModel) {
  let returnString = `\`${ channelName }\``;
  returnString = returnString.replace(/\//g, '.');
  for (const paramName in parameters) {
    returnString = returnString.replace(`{${paramName}}`, `\${${paramName}}`);
  }
  return returnString;
}
  
/**
 * Realize channel name to NATS topic without replacing parameters
 * 
 * @param {string} channelName 
 */
export function realizeChannelNameWithoutParameters(channelName: string) {
  return realizeChannelName(channelName, undefined);
}

export function camelCase(value: string) {
  return changeCase.camelCase(value);
}
export function pascalCase(value: string) {
  return changeCase.pascalCase(value);
}
