import { ConstrainedMetaModel } from "@asyncapi/modelina";
import { TypeScriptRenderer } from "@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer";

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

export function generateTypescriptValidationCode({content, model, renderer}: {content: string, model: ConstrainedMetaModel, renderer: TypeScriptRenderer}) {
  renderer.dependencyManager.addTypeScriptDependency(
    '{Ajv, Options as AjvOptions, ErrorObject, ValidateFunction}',
    'ajv'
  );
  renderer.dependencyManager.addTypeScriptDependency(
    'addFormats',
    'ajv-formats'
  );
  return `${content}
public static theCodeGenSchema = ${safeStringify(model.originalInput)};
public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const validate = ajvValidatorFunction ?? this.createValidator(context)
  return {
    valid: validate(parsedData),
    errors: validate.errors ?? undefined,
  };
}
public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
  addFormats(ajvInstance);
  const validate = ajvInstance.compile(this.theCodeGenSchema);
  return validate;
}
`;
}
