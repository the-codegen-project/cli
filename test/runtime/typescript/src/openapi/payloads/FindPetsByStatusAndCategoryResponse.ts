import {APet} from './APet';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type FindPetsByStatusAndCategoryResponse = APet[] | string | string;

export function unmarshal(json: any): FindPetsByStatusAndCategoryResponse {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if(Array.isArray(parsed)) {
    const unmarshalledArray = parsed.map(item => {
      if (item) {
        return APet.unmarshal(item);
      }
      return item;
    });
    return unmarshalledArray;
  }
  
  return parsed;
}
export function marshal(payload: FindPetsByStatusAndCategoryResponse): string {
  if(payload instanceof Array) {
  return JSON.stringify(payload.map(item => {
    if(item && typeof item === 'object' && typeof item.marshal === 'function') {
      return item.marshal();
    }
    return item;
  }));
}
  return JSON.stringify(payload);
}
export function unmarshalByStatusCode(json: any, statusCode: number): {error?: string, statusCode: number, payload?: FindPetsByStatusAndCategoryResponse} {
  switch(statusCode) {
    case 200:
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(parsed)) {
    throw new Error('Expected array');
  }
  const unmarshalledArray = parsed.map(item => {
    if (item) {
      return APet.unmarshal(item);
    }
    return item;
  });
    return {statusCode, payload: unmarshalledArray};
case 400:
    return {statusCode, payload: JSON.parse(json) as string};
case 404:
    return {statusCode, payload: JSON.parse(json) as string};
    default:
      return {error: `No matching type found for status code: ${statusCode}`, statusCode};
  }
}
export const theCodeGenSchema = {"type":"object","oneOf":[{"type":"array","items":{"title":"a Pet","description":"A pet for sale in the pet store","type":"object","required":["name","photoUrls"],"properties":{"id":{"type":"integer","format":"int64"},"category":{"title":"Pet category","description":"A category for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string","pattern":"^[a-zA-Z0-9]+[a-zA-Z0-9\\.\\-_]*[a-zA-Z0-9]+$"}},"xml":{"name":"Category"}},"name":{"type":"string","example":"doggie"},"photoUrls":{"type":"array","xml":{"name":"photoUrl","wrapped":true},"items":{"type":"string"}},"tags":{"type":"array","xml":{"name":"tag","wrapped":true},"items":{"title":"Pet Tag","description":"A tag for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"}},"xml":{"name":"Tag"}}},"status":{"type":"string","description":"pet status in the store","deprecated":true,"enum":["available","pending","sold"]}},"xml":{"name":"Pet"}},"$id":"findPetsByStatusAndCategory_Response_200"},{"type":"string","description":"Invalid status value or category ID","$id":"findPetsByStatusAndCategory_Response_400"},{"type":"string","description":"Category not found","$id":"findPetsByStatusAndCategory_Response_404"}],"$id":"FindPetsByStatusAndCategoryResponse","$schema":"http://json-schema.org/draft-07/schema"};
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


export { FindPetsByStatusAndCategoryResponse };