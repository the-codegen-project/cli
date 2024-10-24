import {
  checkForReservedKeyword,
  ConstrainedObjectModel,
  FormatHelpers,
  NO_RESERVED_KEYWORDS,
  typeScriptDefaultModelNameConstraints,
  typeScriptDefaultPropertyKeyConstraints,
  TypeScriptOptions
} from '@asyncapi/modelina';
import {DeepPartial} from '../../utils';

/**
 * Cast JSON schema variable to typescript type
 *
 * @param {string} jsonSchemaType
 * @param {string} variableToCast
 */
export function castToTsType(jsonSchemaType: string, variableToCast: string) {
  switch (jsonSchemaType.toLowerCase()) {
    case 'string': {
      return `"" + ${variableToCast}`;
    }

    case 'integer':
    case 'number': {
      return `Number(${variableToCast})`;
    }

    case 'boolean': {
      return `Boolean(${variableToCast})`;
    }

    default: {
      throw new Error(`Parameter type not supported - ${jsonSchemaType}`);
    }
  }
}

/**
 * Realize parameters without using types and without trailing comma
 *
 * @param {Object.<string, ChannelParameter>} parameters
 * @returns
 */
export function realizeParametersForChannelWithoutType(
  parameters: ConstrainedObjectModel
) {
  let returnString = '';
  for (const paramName in Object.keys(parameters.properties)) {
    returnString += `${paramName},`;
  }

  if (returnString.length > 0) {
    returnString = returnString.slice(0, -1);
  }

  return returnString;
}

/**
 * Realize parameters using types without trailing comma
 * @param {Object.<string, ChannelParameter>} channelParameters parameters to realize
 * @param {boolean} required optional or required
 */
export function realizeParametersForChannel(
  channelParameters: ConstrainedObjectModel,
  required = true
) {
  let returnString = '';
  for (const parameter of Object.values(channelParameters.properties)) {
    returnString += `${realizeParameterForChannelWithType(parameter.propertyName, parameter.property.type, required)},`;
  }

  if (returnString.length > 0) {
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
function realizeParameterForChannelWithType(
  parameterName: string,
  parameterType: string,
  required = true
) {
  const requiredType = required ? '' : '?';
  return `${parameterName}${requiredType}: ${parameterType})}`;
}

/**
 * Render channel parameters for JSDoc
 *
 * @param {Object.<string, ChannelParameter>} channelParameters to render
 */
export function renderJSDocParameters(
  channelParameters: ConstrainedObjectModel
) {
  return Object.keys(channelParameters.properties)
    .map((paramName) => {
      return `* @param ${paramName} parameter to use in topic`;
    })
    .join('\n');
}

/**
 * Convert RFC 6570 URI with parameters to NATS topic.
 */
export function realizeChannelName(
  channelName: string,
  parameters?: ConstrainedObjectModel
) {
  let returnString = `\`${channelName}\``;
  returnString = returnString.replaceAll('/', '.');
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
  return realizeChannelName(channelName);
}

export function camelCase(value: string) {
  return FormatHelpers.toCamelCase(value);
}

export function pascalCase(value: string) {
  return FormatHelpers.toPascalCase(value);
}
export function findRegexFromChannel(channel: string): string {
  let topicWithWildcardGroup = channel.replaceAll(/\//g, '\\/');
  topicWithWildcardGroup = topicWithWildcardGroup.replaceAll(
    /{[^}]+}/g,
    '([^.]*)'
  );
  return `/^${topicWithWildcardGroup}$/`;
}
export const RESERVED_TYPESCRIPT_KEYWORDS = [
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'any',
  'boolean',
  'constructor',
  'declare',
  'get',
  'module',
  'require',
  'number',
  'set',
  'string',
  'symbol',
  'type',
  'from',
  'of',
  // Strict mode reserved words
  'arguments',
  'as',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield'
];

export const defaultCodegenTypescriptModelinaOptions: DeepPartial<TypeScriptOptions> =
  {
    constraints: {
      modelName: typeScriptDefaultModelNameConstraints({
        NO_RESERVED_KEYWORDS: (name) => {
          // Since all names are pascal we can ignore reserved keywords.
          return name;
        },
        NO_SPECIAL_CHAR: (name) => {
          // Looks nicer with no special cases at all
          return name.replace(/\W/g, ' ');
        }
      }),
      propertyKey: typeScriptDefaultPropertyKeyConstraints({
        NO_RESERVED_KEYWORDS: (value) => {
          return NO_RESERVED_KEYWORDS(value, (word) =>
            // Filter out all the keywords that does not ruin the code
            checkForReservedKeyword(
              word,
              RESERVED_TYPESCRIPT_KEYWORDS.filter((filteredValue) => {
                return filteredValue !== 'type';
              }),
              true
            )
          );
        }
      })
    }
  };
