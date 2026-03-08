import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type ArrayWithMinItems = string[];

export function unmarshal(json: string | any[]): ArrayWithMinItems {
  if (typeof json === 'string') {
    return JSON.parse(json) as ArrayWithMinItems;
  }
  return json as ArrayWithMinItems;
}
export function marshal(payload: ArrayWithMinItems): string {
  return JSON.stringify(payload);
}
export const theCodeGenSchema = {"type":"array","$schema":"http://json-schema.org/draft-07/schema","items":{"type":"string"},"minItems":1,"description":"Array with minimum 1 item","$id":"ArrayWithMinItems"};
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


export { ArrayWithMinItems };