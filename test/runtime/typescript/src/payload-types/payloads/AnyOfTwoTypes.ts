import {AnyOfTwoTypesAnyOfOption0} from './AnyOfTwoTypesAnyOfOption0';
import {AnyOfTwoTypesAnyOfOption1} from './AnyOfTwoTypesAnyOfOption1';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type AnyOfTwoTypes = AnyOfTwoTypesAnyOfOption0 | AnyOfTwoTypesAnyOfOption1;

export function unmarshal(json: any): AnyOfTwoTypes {
  
  return JSON.parse(json);
}
export function marshal(payload: AnyOfTwoTypes) {
  if(payload instanceof AnyOfTwoTypesAnyOfOption0) {
return payload.marshal();
}
if(payload instanceof AnyOfTwoTypesAnyOfOption1) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"$schema":"http://json-schema.org/draft-07/schema","anyOf":[{"type":"object","properties":{"name":{"type":"string"}}},{"type":"object","properties":{"id":{"type":"integer"}}}],"description":"AnyOf with two object schemas","$id":"AnyOfTwoTypes"};
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


export { AnyOfTwoTypes };