import {Ping} from './Ping';
import {Pong} from './Pong';
import {NotFound} from './NotFound';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type PingPayload = Ping | Pong | NotFound;

export function unmarshal(json: any): PingPayload {
  
  return JSON.parse(json);
}
export function marshal(payload: PingPayload) {
  if(payload instanceof Ping) {
return payload.marshal();
}
if(payload instanceof Pong) {
return payload.marshal();
}
if(payload instanceof NotFound) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export function unmarshalByStatusCode(json: any, statusCode: number): PingPayload {
  if (statusCode === 200) {
    return Pong.unmarshal(json);
  }
  if (statusCode === 404) {
    return NotFound.unmarshal(json);
  }
  throw new Error(`No matching type found for status code: ${statusCode}`);
}
export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","properties":{"ping":{"type":"string","description":"ping name"}},"$id":"ping"},{"type":"object","properties":{"pong":{"type":"string","description":"pong name"}},"$id":"pong"},{"type":"object","properties":{"error":{"type":"string","description":"Error message"},"code":{"type":"string","description":"Error code"}},"$id":"notFound"}],"$id":"PingPayload"};
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


export { PingPayload };