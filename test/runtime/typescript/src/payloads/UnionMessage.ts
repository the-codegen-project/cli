import {AnonymousSchema_9} from './AnonymousSchema_9';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type UnionMessage = string | number | AnonymousSchema_9;

export function unmarshal(json: any): UnionMessage {
  
  return JSON.parse(json);
}
export function marshal(payload: UnionMessage) {
  

if(payload instanceof AnonymousSchema_9) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"string"},{"type":"number"},{"type":"object","properties":{"name":{"type":"string"}}}],"description":"A union type payload","$id":"UnionMessage"};
export function validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
  const {data, ajvValidatorFunction} = context ?? {};
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


export { UnionMessage };