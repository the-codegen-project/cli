import {OneOfThreeTypesOneOfOption2} from './OneOfThreeTypesOneOfOption2';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type OneOfThreeTypes = string | number | OneOfThreeTypesOneOfOption2;

export function unmarshal(json: any): OneOfThreeTypes {
  
  return JSON.parse(json);
}
export function marshal(payload: OneOfThreeTypes) {
  

if(payload instanceof OneOfThreeTypesOneOfOption2) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"string"},{"type":"integer"},{"type":"object","properties":{"value":{"type":"string"}}}],"description":"OneOf with three type options","$id":"OneOfThreeTypes"};
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


export { OneOfThreeTypes };