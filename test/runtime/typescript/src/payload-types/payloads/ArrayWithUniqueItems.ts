import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Array requiring unique items
 */
type ArrayWithUniqueItems = string[];

export function unmarshal(json: string | any[]): ArrayWithUniqueItems {
  if (typeof json === 'string') {
    return JSON.parse(json) as ArrayWithUniqueItems;
  }
  return json as ArrayWithUniqueItems;
}
export function marshal(payload: ArrayWithUniqueItems): string {
  return JSON.stringify(payload);
}
export const theCodeGenSchema = {"type":"array","$schema":"http://json-schema.org/draft-07/schema","items":{"type":"string"},"uniqueItems":true,"description":"Array requiring unique items","$id":"ArrayWithUniqueItems"};
export function validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
  // Intentionally parse JSON strings to support validation of marshalled output.
  // Example: validate({data: marshal(obj)}) works because marshal returns JSON string.
  // Note: String 'true' will be coerced to boolean true due to JSON.parse.
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const validate = ajvValidatorFunction ?? createValidator(context)
  return {
    valid: validate(parsedData),
    errors: validate.errors ?? undefined,
  };
}
export function createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
  addFormats(ajvInstance);
  
  const validate = ajvInstance.compile(theCodeGenSchema);
  return validate;
}


export { ArrayWithUniqueItems };