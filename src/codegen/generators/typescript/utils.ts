import {
  checkForReservedKeyword,
  ConstrainedObjectModel,
  FormatHelpers,
  NO_RESERVED_KEYWORDS,
  OutputModel,
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
 * Class preset for payload models. Prepends a plain-data companion
 * `interface <Name>Interface` above the class (`self`) and rewrites the
 * constructor to accept `input: <Name>Interface` (`ctor`), reusing the same
 * body helper as {@link parameterClassPreset}.
 *
 * Unlike {@link parameterClassPreset}, this preset *augments* the existing
 * payload preset chain rather than replacing it: it deliberately omits
 * `additionalContent` (the validation preset owns that) and must be inserted
 * **after** `TS_COMMON_PRESET` so its `ctor` override wins. Only object/class
 * payloads gain the interface; non-object payloads (unions/primitives/enums)
 * have no class hook and are untouched.
 */
export function payloadClassPreset(): TypeScriptPreset<TypeScriptOptions> {
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
      }
    }
  };
}

/**
 * Rewrite a generated model's trailing `export { <Name> };` to also export the
 * companion `<Name>Interface` emitted by a class preset. Modelina appends the
 * export outside the preset chain, so the interface (raw text injected by the
 * `self` hook) would otherwise not be exported. Only rewrites when the
 * companion interface is actually present, so models without the interface
 * treatment (non-object payloads) are left untouched. Shared by the parameter
 * and payload generators so the rewrite logic can never diverge.
 */
export function withCompanionInterfaceExport(model: OutputModel): OutputModel {
  const interfaceName = `${model.modelName}Interface`;
  const originalExport = `export { ${model.modelName} };`;
  if (
    !model.result.includes(`interface ${interfaceName}`) ||
    !model.result.includes(originalExport)
  ) {
    return model;
  }
  const rewritten = model.result.replace(
    originalExport,
    `export { ${model.modelName}, ${interfaceName} };`
  );
  return OutputModel.toOutputModel({
    result: rewritten,
    model: model.model,
    modelName: model.modelName,
    inputModel: model.inputModel,
    dependencies: model.dependencies
  });
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
