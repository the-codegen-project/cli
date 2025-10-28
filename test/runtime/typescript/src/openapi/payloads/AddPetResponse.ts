import {APet} from './APet';
import {OneOf_0Status} from './OneOf_0Status';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type AddPetResponse = APet | string;

export function unmarshal(json: any): AddPetResponse {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if(json.status === OneOf_0Status.AVAILABLE) {
  return APet.unmarshal(json);
  }
  if(typeof parsed === 'object' && parsed !== null) {
    if(parsed.status === OneOf_0Status.AVAILABLE) {
  return APet.unmarshal(json);
  }
  }
  return parsed;
}
export function marshal(payload: AddPetResponse): string {
  if(payload instanceof APet) {
  return payload.marshal();
}
  return JSON.stringify(payload);
}
export function unmarshalByStatusCode(json: any, statusCode: number): {error?: string, statusCode: number, payload?: AddPetResponse} {
  switch(statusCode) {
    case 200:
    return {statusCode, payload: APet.unmarshal(json)};
case 405:
    return {statusCode, payload: JSON.parse(json) as string};
    default:
      return {error: `No matching type found for status code: ${statusCode}`, statusCode};
  }
}
export const theCodeGenSchema = {"type":"object","oneOf":[{"title":"a Pet","description":"A pet for sale in the pet store","type":"object","required":["name","photoUrls"],"properties":{"id":{"type":"integer","format":"int64"},"category":{"title":"Pet category","description":"A category for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string","pattern":"^[a-zA-Z0-9]+[a-zA-Z0-9\\.\\-_]*[a-zA-Z0-9]+$"}},"xml":{"name":"Category"}},"name":{"type":"string","example":"doggie"},"photoUrls":{"type":"array","xml":{"name":"photoUrl","wrapped":true},"items":{"type":"string"}},"tags":{"type":"array","xml":{"name":"tag","wrapped":true},"items":{"title":"Pet Tag","description":"A tag for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"}},"xml":{"name":"Tag"}}},"status":{"type":"string","description":"pet status in the store","deprecated":true,"enum":["available","pending","sold"]}},"xml":{"name":"Pet"},"$id":"addPet_Response_200"},{"type":"string","description":"Invalid input","$id":"addPet_Response_405"}],"$id":"AddPetResponse","$schema":"http://json-schema.org/draft-07/schema"};
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
  ajvInstance.addVocabulary(["xml", "example"])
  const validate = ajvInstance.compile(theCodeGenSchema);
  return validate;
}


export { AddPetResponse };