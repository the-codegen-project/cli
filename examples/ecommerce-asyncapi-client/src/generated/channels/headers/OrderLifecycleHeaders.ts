import {OrderCreatedHeaders} from './OrderCreatedHeaders';
import {OrderUpdatedHeaders} from './OrderUpdatedHeaders';
import {OrderCancelledHeaders} from './OrderCancelledHeaders';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
type OrderLifecycleHeaders = OrderCreatedHeaders | OrderUpdatedHeaders | OrderCancelledHeaders;

export function unmarshal(json: any): OrderLifecycleHeaders {
  
  return JSON.parse(json);
}
export function marshal(payload: OrderLifecycleHeaders) {
  if(payload instanceof OrderCreatedHeaders) {
return payload.marshal();
}
if(payload instanceof OrderUpdatedHeaders) {
return payload.marshal();
}
if(payload instanceof OrderCancelledHeaders) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"$id":"OrderLifecycleHeaders","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","required":["x-correlation-id","x-order-id","x-customer-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid"},"x-order-id":{"type":"string","format":"uuid"},"x-customer-id":{"type":"string","format":"uuid"},"x-source-service":{"type":"string"}},"$id":"OrderCreatedHeaders","$schema":"http://json-schema.org/draft-07/schema"},{"type":"object","required":["x-correlation-id","x-order-id","x-customer-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid"},"x-order-id":{"type":"string","format":"uuid"},"x-customer-id":{"type":"string","format":"uuid"},"x-source-service":{"type":"string"}},"$id":"OrderUpdatedHeaders","$schema":"http://json-schema.org/draft-07/schema"},{"type":"object","required":["x-correlation-id","x-order-id","x-customer-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid"},"x-order-id":{"type":"string","format":"uuid"},"x-customer-id":{"type":"string","format":"uuid"},"x-source-service":{"type":"string"}},"$id":"OrderCancelledHeaders","$schema":"http://json-schema.org/draft-07/schema"}]};
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
  // `ajv-formats` is CommonJS; its default import is the module namespace under
  // `moduleResolution: node16`/`nodenext`, so unwrap `.default` when present.
  const addFormats = ((addFormatsModule as unknown as {default?: unknown}).default ?? addFormatsModule) as (ajv: Ajv) => Ajv;
  addFormats(ajvInstance);
  
  const validate = ajvInstance.compile(theCodeGenSchema);
  return validate;
}


export { OrderLifecycleHeaders };