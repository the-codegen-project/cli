import {OrderCreatedHeaders} from './OrderCreatedHeaders';
import {OrderStatusChangedHeaders} from './OrderStatusChangedHeaders';
import {SourceService} from './SourceService';
import {ActorType} from './ActorType';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
type OrderEventsHeaders = OrderCreatedHeaders | OrderStatusChangedHeaders;

export function unmarshal(json: any): OrderEventsHeaders {
  if(typeof json === 'object') {
    if(json.x-source-service === SourceService.WEB_MINUS_APP) {
  return OrderCreatedHeaders.unmarshal(json);
  }
  if(json.x-actor-type === ActorType.USER) {
  return OrderStatusChangedHeaders.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: OrderEventsHeaders) {
  if(payload instanceof OrderCreatedHeaders) {
return payload.marshal();
}
if(payload instanceof OrderStatusChangedHeaders) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"$id":"OrderEventsHeaders","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","properties":{"authorization":{"type":"string","pattern":"^Bearer [A-Za-z0-9\\-\\._~\\+\\/]+=*$","description":"JWT token for authentication"}}},{"type":"object","properties":{"x-source-service":{"type":"string","enum":["web-app","mobile-app","admin-panel"],"description":"Service that originated the event"},"x-api-version":{"type":"string","pattern":"^v[0-9]+$","description":"API version used","default":"v1"},"x-request-id":{"type":"string","format":"uuid","description":"Original request ID from the client"}}},{"type":"object","required":["x-user-id"],"properties":{"x-user-id":{"type":"string","format":"uuid","description":"ID of the user who created the order"}}}],"$id":"OrderCreatedHeaders","$schema":"http://json-schema.org/draft-07/schema"},{"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","properties":{"x-actor-id":{"type":"string","format":"uuid","description":"ID of user/system that triggered the change"},"x-actor-type":{"type":"string","enum":["user","system","admin"],"description":"Type of actor that triggered the change"}}},{"type":"object","required":["x-event-type"],"properties":{"x-event-type":{"type":"string","enum":["status-change","cancellation","refund"],"description":"Type of status change event"},"x-previous-status":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled"],"description":"Order status values"},"x-reason-code":{"type":"string","enum":["customer-request","payment-failed","inventory-unavailable","fraud-detected"],"description":"Reason code for status change"},"x-priority":{"type":"string","enum":["low","normal","high","urgent"],"default":"normal","description":"Processing priority"}}}],"$id":"OrderStatusChangedHeaders","$schema":"http://json-schema.org/draft-07/schema"}]};
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


export { OrderEventsHeaders };