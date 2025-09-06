import {ConstrainedMetaModel} from '@asyncapi/modelina';
import {TypeScriptRenderer} from '@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer';
import {
  TypescriptHeadersContext,
  TypeScriptPayloadContext
} from '../generators';

/**
 * Safe stringify that removes x- properties and circular references by assuming true
 */
export function safeStringify(value: any): string {
  let depth = 0;
  const maxDepth = 255;
  const maxRepetitions = 5; // Allow up to 5 repetitions of the same object

  // eslint-disable-next-line sonarjs/cognitive-complexity
  function stringify(val: any, currentPath: any[] = []): any {
    // Check depth limit
    if (depth > maxDepth) {
      return true;
    }

    switch (typeof val) {
      case 'function':
        return true;
      case 'boolean':
      case 'number':
      case 'string':
        return val;
      case 'object': {
        if (val === null) {
          return null;
        }

        // Check for immediate circular reference (direct self-reference)
        if (
          currentPath.length > 0 &&
          currentPath[currentPath.length - 1] === val
        ) {
          return true;
        }

        // Count how many times this object appears in the current path
        const repetitionCount = currentPath.filter((obj) => obj === val).length;

        // If we've seen this object too many times in the current path, cut it off
        if (repetitionCount >= maxRepetitions) {
          return true;
        }

        depth++;
        const newPath = [...currentPath, val];

        let result: any;

        if (Array.isArray(val)) {
          result = val.map((item) => stringify(item, newPath));
        } else {
          result = {};
          for (const [key, value] of Object.entries(val)) {
            // Skip extension properties
            if (
              key.startsWith('x-modelina') ||
              key.startsWith('x-the-codegen-project') ||
              key.startsWith('x-parser-') ||
              key.startsWith('x-modelgen-') ||
              key.startsWith('discriminator')
            ) {
              continue;
            }
            // eslint-disable-next-line security/detect-object-injection
            result[key] = stringify(value, newPath);
          }
        }

        depth--;
        return result;
      }
      case 'undefined':
        return undefined;
      default:
        return true;
    }
  }

  return JSON.stringify(stringify(value));
}

export function generateTypescriptValidationCode({
  model,
  renderer,
  asClassMethods = true,
  context
}: {
  model: ConstrainedMetaModel;
  renderer: TypeScriptRenderer;
  asClassMethods?: boolean;
  context: TypeScriptPayloadContext | TypescriptHeadersContext;
}) {
  renderer.dependencyManager.addTypeScriptDependency(
    '{Ajv, Options as AjvOptions, ErrorObject, ValidateFunction}',
    'ajv'
  );
  renderer.dependencyManager.addTypeScriptDependency(
    'addFormats',
    'ajv-formats'
  );

  const schemaProperty = asClassMethods
    ? 'public static theCodeGenSchema'
    : 'export const theCodeGenSchema';

  const methodPrefix = asClassMethods ? 'public static ' : 'export function ';

  const createValidatorCall = asClassMethods
    ? 'this.createValidator(context)'
    : 'createValidator(context)';

  const compileCall = asClassMethods
    ? 'this.theCodeGenSchema'
    : 'theCodeGenSchema';

  const vocabularies =
    context.inputType === 'openapi'
      ? 'ajvInstance.addVocabulary(["xml", "example"])'
      : '';

  return `${schemaProperty} = ${safeStringify(model.originalInput)};
${methodPrefix}validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const validate = ajvValidatorFunction ?? ${createValidatorCall}
  return {
    valid: validate(parsedData),
    errors: validate.errors ?? undefined,
  };
}
${methodPrefix}createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
  addFormats(ajvInstance);
  ${vocabularies}
  const validate = ajvInstance.compile(${compileCall});
  return validate;
}
`;
}
