import {EmailNotification} from './EmailNotification';
import {SmsNotification} from './SmsNotification';
import {PushNotification} from './PushNotification';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
type NotificationSent = EmailNotification | SmsNotification | PushNotification;

export const theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","oneOf":[{"type":"object","required":["type","recipientId","subject","body"],"properties":{"type":{"const":"email"},"recipientId":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"},"attachments":{"type":"array","items":{"type":"object","properties":{"filename":{"type":"string"},"contentType":{"type":"string"},"data":{"type":"string","contentEncoding":"base64"}}}}}},{"type":"object","required":["type","recipientId","message"],"properties":{"type":{"const":"sms"},"recipientId":{"type":"string"},"message":{"type":"string","maxLength":160}}},{"type":"object","required":["type","recipientId","title","body"],"properties":{"type":{"const":"push"},"recipientId":{"type":"string"},"title":{"type":"string"},"body":{"type":"string"},"badge":{"type":"integer","minimum":0}}}],"$id":"NotificationSent"};
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
export function unmarshal(json: any): NotificationSent {
  if(typeof json === 'object') {
    if(json.type === 'email') {
  return EmailNotification.unmarshal(json);
  }
  if(json.type === 'sms') {
  return SmsNotification.unmarshal(json);
  }
  if(json.type === 'push') {
  return PushNotification.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: NotificationSent) {
  if(payload instanceof EmailNotification) {
return payload.marshal();
}
if(payload instanceof SmsNotification) {
return payload.marshal();
}
if(payload instanceof PushNotification) {
return payload.marshal();
}
  return JSON.stringify(payload);
}

export { NotificationSent };