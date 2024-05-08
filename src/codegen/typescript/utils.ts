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
 * 
 * @param {string} channelName to be unwrapped
 * @param {Object.<string, ChannelParameter>} channelParameters the parameters which are to be unwrapped from the NATS topic.
 */
export function unwrap(channelName: string, channelParameters: Record<string, ChannelParameter>) {
  //Nothing to unwrap if no parameters are used
  if (Object.keys(channelParameters).length === 0) {
    return ''
  }

  let parameterSplit: string[] = []
  let prevParameterName: string = null

  //Create the parameter split operation which unwraps it one by one.
  parameterSplit = Object.entries(channelParameters).map(([parameterName, _]) => {
    let toReturn
    const parameterCamelCase = camelCase(parameterName)
    if (prevParameterName) {
      toReturn = `const ${parameterCamelCase}Split = ${prevParameterName}Split[1].split("${`{${parameterName}}`}");`
    } else {
      toReturn = `const ${parameterCamelCase}Split = unmodifiedChannel.split("${`{${parameterName}}`}");`
    }
    prevParameterName = parameterCamelCase
    return toReturn
  })

  //Create the split array which contains the string between each parameter
  let splits = Object.entries(channelParameters).map(([parameterName, _], index) => {
    const parameterCamelCase = camelCase(parameterName)
    // Check if we reached the end of the parameter list
    if (index + 1 === Object.keys(channelParameters).length) {
      return `
		${parameterCamelCase}Split[0],
		${parameterCamelCase}Split[1]
		`
    }
    return `${parameterCamelCase}Split[0],`
  })

  //Retrieve the actual parameters from the received NATS topic using the split array
  prevParameterName = null
  let parameterReplacement = ''
  parameterReplacement = Object.entries(channelParameters).map(([parameterName, parameter], index) => {
    let channelSplit = `channel = channel.substring(${prevParameterName}End+splits[${index}].length);`
    // Overwrite the split if it is the first parameter
    if (index === 0) {
      channelSplit = `channel = channel.substring(splits[${index}].length);`
    }
    prevParameterName = camelCase(parameterName)
    const paramToCast = `channel.substring(0, ${prevParameterName}End)`
    return `
		${channelSplit}
		const ${prevParameterName}End = channel.indexOf(splits[${index + 1}]);
		const ${prevParameterName}Param = ${castToTsType(parameter.schema().type(), paramToCast)};
	  `
  })

  return `
	const unmodifiedChannel = ${realizeChannelNameWithoutParameters(channelName)};
	let channel = msg.subject;
	${parameterSplit.join('')}
	const splits = [
	  ${splits.join('')}
	];
	${parameterReplacement.join('')}
	`
}

/**
 * Realize parameters without using types and without trailing comma
 * 
 * @param {Object.<string, ChannelParameter>} parameters 
 * @returns 
 */
export function realizeParametersForChannelWithoutType(parameters) {
  let returnString = '';
  for (const paramName in parameters) {
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
export function realizeParametersForChannelWrapper(channelParameters, required = true) {
  return Object.keys(channelParameters).length ? `,${realizeParametersForChannel(channelParameters, required)}` : '';
}

/**
  * Realize parameters using types without trailing comma
  * @param {Object.<string, ChannelParameter>} channelParameters parameters to realize
  * @param {boolean} required optional or required
  */
export function realizeParametersForChannel(channelParameters, required = true) {
  let returnString = '';
  for (const paramName in channelParameters) {
    returnString += `${realizeParameterForChannelWithType(paramName, channelParameters[`${paramName}`], required)  },`;
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
function realizeParameterForChannelWithType(parameterName, parameter, required = true) {
  const requiredType = !required ? '?' : '';
  return `${parameterName}${requiredType}: ${toTsType(
    parameter.schema().type()
  )}`;
}

/**
 * Render channel parameters for JSDoc
 * 
 * @param {Object.<string, ChannelParameter>} channelParameters to render
 */
export function renderJSDocParameters(channelParameters) {
  return Object.keys(channelParameters).map((paramName) => {
    return `* @param ${paramName} parameter to use in topic`;
  }).join('\n');
}

/**
 * Convert RFC 6570 URI with parameters to NATS topic. 
 * 
 * @param {Object.<string, ChannelParameter>} parameters 
 * @param {string} channelName 
 * @returns 
 */
export function realizeChannelName(parameters, channelName) {
  let returnString = `\`${  channelName  }\``;
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
export function realizeChannelNameWithoutParameters(channelName) {
  return realizeChannelName(null, channelName);
}

export function camelCase(value: string) {
  return changeCase.camelCase(value);
}
export function pascalCase(value: string) {
  return changeCase.pascalCase(value);
}
export function kebabCase(value: string) {
  return changeCase.kebabCase(value);
}