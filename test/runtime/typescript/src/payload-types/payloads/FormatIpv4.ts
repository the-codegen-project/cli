import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type FormatIpv4 = string;

export function unmarshal(json: string): FormatIpv4 {
  return JSON.parse(json) as FormatIpv4;
}
export function marshal(payload: FormatIpv4): string {
  return JSON.stringify(payload);
}
export const theCodeGenSchema = {"type":"string","$schema":"http://json-schema.org/draft-07/schema","format":"ipv4","description":"String with IPv4 format","$id":"FormatIpv4"};
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


export { FormatIpv4 };