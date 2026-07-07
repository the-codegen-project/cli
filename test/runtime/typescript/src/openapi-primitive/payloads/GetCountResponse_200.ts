import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
type GetCountResponse_200 = number;

export function unmarshal(json: string): GetCountResponse_200 {
  return JSON.parse(json) as GetCountResponse_200;
}
export function marshal(payload: GetCountResponse_200): string {
  return JSON.stringify(payload);
}
export const theCodeGenSchema = {"type":"number","$id":"getCount_Response_200","$schema":"http://json-schema.org/draft-07/schema"};
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
  ajvInstance.addVocabulary(["xml", "example"])
  const validate = ajvInstance.compile(theCodeGenSchema);
  return validate;
}


export { GetCountResponse_200 };