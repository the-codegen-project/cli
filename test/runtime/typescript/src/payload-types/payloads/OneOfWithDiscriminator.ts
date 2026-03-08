import {DogPayload} from './DogPayload';
import {CatPayload} from './CatPayload';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
type OneOfWithDiscriminator = DogPayload | CatPayload;

export function unmarshal(json: any): OneOfWithDiscriminator {
  if(typeof json === 'object') {
    if(json.petType === 'dog') {
  return DogPayload.unmarshal(json);
  }
  if(json.petType === 'cat') {
  return CatPayload.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: OneOfWithDiscriminator) {
  if(payload instanceof DogPayload) {
return payload.marshal();
}
if(payload instanceof CatPayload) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","properties":{"petType":{"const":"dog"},"breed":{"type":"string"},"barkVolume":{"type":"integer"}},"required":["petType"]},{"type":"object","properties":{"petType":{"const":"cat"},"breed":{"type":"string"},"meowPitch":{"type":"string"}},"required":["petType"]}],"description":"OneOf with discriminator property","$id":"OneOfWithDiscriminator"};
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


export { OneOfWithDiscriminator };