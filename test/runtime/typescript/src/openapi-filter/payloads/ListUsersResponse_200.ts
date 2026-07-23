import {User} from './User';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
type ListUsersResponse_200 = User[];

export function unmarshal(json: string | any[]): ListUsersResponse_200 {
  const arr = typeof json === 'string' ? JSON.parse(json) : json;
  return arr.map((item: any) => {
    if (item && typeof item === 'object') {
      return User.unmarshal(item);
    }
    return item;
  }) as ListUsersResponse_200;
}
export function marshal(payload: ListUsersResponse_200): string {
  return JSON.stringify(payload.map((item) => {
    if (item && typeof item === 'object' && 'marshal' in item && typeof item.marshal === 'function') {
      return JSON.parse(item.marshal());
    }
    return item;
  }));
}
export const theCodeGenSchema = {"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"displayName":{"type":"string"},"address":{"type":"object","properties":{"street":{"type":"string"},"city":{"type":"string"}}}}},"$id":"listUsers_Response_200","$schema":"http://json-schema.org/draft-07/schema"};
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


export { ListUsersResponse_200 };