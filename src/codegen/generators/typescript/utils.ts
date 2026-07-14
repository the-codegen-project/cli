import {
  checkForReservedKeyword,
  ConstrainedObjectModel,
  FormatHelpers,
  NO_RESERVED_KEYWORDS,
  typeScriptDefaultModelNameConstraints,
  typeScriptDefaultPropertyKeyConstraints,
  TypeScriptOptions,
  TypeScriptPreset
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
export function realizeParameterForChannelWithType(
  parameterName: string,
  parameterType: string,
  required = true
) {
  const requiredType = required ? '' : '?';
  return `${parameterName}${requiredType}: ${parameterType}`;
}

/**
 * Build the body of a parameter `interface` declaration from a constrained
 * object model. Emits one 2-space-indented `propertyName<?>: type` line per
 * property (newline-separated, no trailing separator); `?` is added when the
 * property is not required. Used by the parameter generators to prepend a
 * plain-data companion interface above each generated parameter class.
 */
export function buildParametersInterfaceBody(
  model: ConstrainedObjectModel
): string {
  return Object.values(model.properties)
    .filter((parameter) => !parameter.property.options.const)
    .map((parameter) => {
      const requiredType = parameter.required ? '' : '?';
      return `  ${parameter.propertyName}${requiredType}: ${parameter.property.type}`;
    })
    .join('\n');
}

/**
 * Shared class preset for parameter models. Prepends a plain-data companion
 * `interface <Name>Interface` above the class (`self`), rewrites the
 * constructor to accept `input: <Name>Interface` (`ctor`), and appends the
 * input-specific helper methods (`additionalContent`). Reused by both the
 * OpenAPI and AsyncAPI parameter generators so the interface + ctor logic can
 * never diverge between them.
 */
export function parameterClassPreset(
  generateAdditionalMethods: (model: ConstrainedObjectModel) => string
): TypeScriptPreset<TypeScriptOptions> {
  return {
    class: {
      self: ({content, model}) =>
        `interface ${model.name}Interface {
${buildParametersInterfaceBody(model)}
}
${content}`,
      ctor: ({renderer, model}) => {
        const assignments = Object.values(model.properties)
          .filter((property) => !property.property.options.const)
          .map(
            (property) =>
              `this._${property.propertyName} = input.${property.propertyName};`
          );
        return `constructor(input: ${model.name}Interface) {
${renderer.indent(renderer.renderBlock(assignments))}
}`;
      },
      additionalContent: ({content, model}) =>
        `${content}
${generateAdditionalMethods(model)}`
    }
  };
}

/**
 * Convert RFC 6570 URI with parameters to NATS topic.
 */
export function realizeChannelName(
  channelName: string,
  parameters?: ConstrainedObjectModel
) {
  let returnString = `\`${channelName}\``;
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
  return realizeChannelName(channelName);
}

export function camelCase(value: string) {
  return FormatHelpers.toCamelCase(value);
}

export function pascalCase(value: string) {
  return FormatHelpers.toPascalCase(value);
}
export function findRegexFromChannel(channel: string): string {
  let topicWithWildcardGroup = channel.replace(/\//g, '\\/');
  topicWithWildcardGroup = topicWithWildcardGroup.replace(
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

// Export for use in preset configurations
export {typeScriptDefaultPropertyKeyConstraints};
