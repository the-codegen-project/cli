import {OrderCreated} from './OrderCreated';
import {OrderUpdated} from './OrderUpdated';
import {OrderCancelled} from './OrderCancelled';
import {OrderStatus} from './OrderStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type SubscribeToOrderEventsPayload = OrderCreated | OrderUpdated | OrderCancelled;

export function unmarshal(json: any): SubscribeToOrderEventsPayload {
  if(typeof json === 'object') {
    if(json.status === OrderStatus.PENDING) {
  return OrderUpdated.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: SubscribeToOrderEventsPayload) {
  if(payload instanceof OrderCreated) {
return payload.marshal();
}
if(payload instanceof OrderUpdated) {
return payload.marshal();
}
if(payload instanceof OrderCancelled) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","required":["orderId","customerId","items","totalAmount"],"properties":{"orderId":{"type":"string","format":"uuid"},"customerId":{"type":"string","format":"uuid"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","format":"uuid"},"quantity":{"type":"integer","minimum":1},"unitPrice":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"productName":{"type":"string"},"productCategory":{"type":"string"}}}},"totalAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string"},"postalCode":{"type":"string"}}},"createdAt":{"type":"string","format":"date-time"}},"$id":"OrderCreated"},{"type":"object","required":["orderId","status","updatedAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled"]},"updatedAt":{"type":"string","format":"date-time"},"reason":{"type":"string"},"updatedFields":{"type":"array","items":{"type":"string"}}},"$id":"OrderUpdated"},{"type":"object","required":["orderId","reason","cancelledAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"reason":{"type":"string"},"cancelledAt":{"type":"string","format":"date-time"},"refundAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}}},"$id":"OrderCancelled"}],"$id":"SubscribeToOrderEventsPayload"};
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


export { SubscribeToOrderEventsPayload };