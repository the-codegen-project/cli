import {OrderCreated} from './OrderCreated';
import {OrderStatusChanged} from './OrderStatusChanged';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
import {Currency} from './Currency';
import {OrderStatus} from './OrderStatus';
type OrderEventsPayload = OrderCreated | OrderStatusChanged;

export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","required":["orderId","customerId","items","totalAmount","currency"],"properties":{"orderId":{"type":"string","format":"uuid","description":"Unique order identifier"},"customerId":{"type":"string","format":"uuid","description":"Customer who placed the order"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","description":"Product identifier"},"quantity":{"type":"integer","minimum":1,"description":"Number of items ordered"},"unitPrice":{"type":"number","minimum":0,"description":"Price per unit in cents"},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}}}},"totalAmount":{"type":"number","minimum":0,"description":"Total order amount in cents"},"currency":{"type":"string","enum":["USD","EUR","GBP"],"description":"Currency code"},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string","minLength":2,"maxLength":2,"description":"ISO 3166-1 alpha-2 country code"},"postalCode":{"type":"string"}}},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}},"$id":"OrderCreated"},{"type":"object","required":["orderId","previousStatus","newStatus","timestamp"],"properties":{"orderId":{"type":"string","format":"uuid"},"previousStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"newStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"timestamp":{"type":"string","format":"date-time"},"reason":{"type":"string","description":"Reason for status change"}},"$id":"OrderStatusChanged"}],"$id":"OrderEventsPayload"};
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
export function unmarshal(json: any): OrderEventsPayload {
  if(typeof json === 'object') {
    if(json.currency === Currency.USD) {
  return OrderCreated.unmarshal(json);
  }
  if(json.previousStatus === OrderStatus.PENDING) {
  return OrderStatusChanged.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: OrderEventsPayload) {
  if(payload instanceof OrderCreated) {
return payload.marshal();
}
if(payload instanceof OrderStatusChanged) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export { OrderEventsPayload };