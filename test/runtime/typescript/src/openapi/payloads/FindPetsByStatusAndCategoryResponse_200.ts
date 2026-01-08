import {APet} from './APet';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type FindPetsByStatusAndCategoryResponse_200 = APet[];

export function unmarshal(json: string | any[]): FindPetsByStatusAndCategoryResponse_200 {
  const arr = typeof json === 'string' ? JSON.parse(json) : json;
  return arr.map((item: any) => {
    if (item && typeof item === 'object') {
      return APet.unmarshal(item);
    }
    return item;
  }) as FindPetsByStatusAndCategoryResponse_200;
}
export function marshal(payload: FindPetsByStatusAndCategoryResponse_200): string {
  return JSON.stringify(payload.map((item) => {
    if (item && typeof item === 'object' && 'marshal' in item && typeof item.marshal === 'function') {
      return JSON.parse(item.marshal());
    }
    return item;
  }));
}
export const theCodeGenSchema = {"type":"array","items":{"title":"a Pet","description":"A pet for sale in the pet store","type":"object","required":["name","photoUrls"],"properties":{"id":{"type":"integer","format":"int64"},"category":{"title":"Pet category","description":"A category for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string","pattern":"^[a-zA-Z0-9]+[a-zA-Z0-9\\.\\-_]*[a-zA-Z0-9]+$"}},"xml":{"name":"Category"}},"name":{"type":"string","example":"doggie"},"photoUrls":{"type":"array","xml":{"name":"photoUrl","wrapped":true},"items":{"type":"string"}},"tags":{"type":"array","xml":{"name":"tag","wrapped":true},"items":{"title":"Pet Tag","description":"A tag for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"}},"xml":{"name":"Tag"}}},"status":{"type":"string","description":"pet status in the store","deprecated":true,"enum":["available","pending","sold"]}},"xml":{"name":"Pet"}},"$id":"findPetsByStatusAndCategory_Response_200","$schema":"http://json-schema.org/draft-07/schema"};
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


export { FindPetsByStatusAndCategoryResponse_200 };