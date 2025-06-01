import {NotificationType} from './NotificationType';
import {NotificationChannel} from './NotificationChannel';
import {NotificationProvider} from './NotificationProvider';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class NotificationSentHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: string;
  private _xNotificationType: NotificationType;
  private _xTemplateId?: string;
  private _xChannelPreference?: NotificationChannel;
  private _xDeliveryAttempt?: number;
  private _xScheduledTime?: string;
  private _xProvider?: NotificationProvider;
  private _xLanguage?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: string,
    xNotificationType: NotificationType,
    xTemplateId?: string,
    xChannelPreference?: NotificationChannel,
    xDeliveryAttempt?: number,
    xScheduledTime?: string,
    xProvider?: NotificationProvider,
    xLanguage?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xNotificationType = input.xNotificationType;
    this._xTemplateId = input.xTemplateId;
    this._xChannelPreference = input.xChannelPreference;
    this._xDeliveryAttempt = input.xDeliveryAttempt;
    this._xScheduledTime = input.xScheduledTime;
    this._xProvider = input.xProvider;
    this._xLanguage = input.xLanguage;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Unique correlation ID for request tracing
   */
  get xCorrelationId(): string { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string) { this._xCorrelationId = xCorrelationId; }

  /**
   * Multi-tenant identifier
   */
  get xTenantId(): string { return this._xTenantId; }
  set xTenantId(xTenantId: string) { this._xTenantId = xTenantId; }

  /**
   * Event creation timestamp
   */
  get xTimestamp(): string | undefined { return this._xTimestamp; }
  set xTimestamp(xTimestamp: string | undefined) { this._xTimestamp = xTimestamp; }

  /**
   * Type of notification sent
   */
  get xNotificationType(): NotificationType { return this._xNotificationType; }
  set xNotificationType(xNotificationType: NotificationType) { this._xNotificationType = xNotificationType; }

  /**
   * Template used for notification
   */
  get xTemplateId(): string | undefined { return this._xTemplateId; }
  set xTemplateId(xTemplateId: string | undefined) { this._xTemplateId = xTemplateId; }

  /**
   * User's preferred notification channel
   */
  get xChannelPreference(): NotificationChannel | undefined { return this._xChannelPreference; }
  set xChannelPreference(xChannelPreference: NotificationChannel | undefined) { this._xChannelPreference = xChannelPreference; }

  /**
   * Delivery attempt number
   */
  get xDeliveryAttempt(): number | undefined { return this._xDeliveryAttempt; }
  set xDeliveryAttempt(xDeliveryAttempt: number | undefined) { this._xDeliveryAttempt = xDeliveryAttempt; }

  /**
   * When notification was scheduled to be sent
   */
  get xScheduledTime(): string | undefined { return this._xScheduledTime; }
  set xScheduledTime(xScheduledTime: string | undefined) { this._xScheduledTime = xScheduledTime; }

  /**
   * Notification service provider
   */
  get xProvider(): NotificationProvider | undefined { return this._xProvider; }
  set xProvider(xProvider: NotificationProvider | undefined) { this._xProvider = xProvider; }

  /**
   * Language code (e.g., en-US, fr-FR)
   */
  get xLanguage(): string | undefined { return this._xLanguage; }
  set xLanguage(xLanguage: string | undefined) { this._xLanguage = xLanguage; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.xCorrelationId !== undefined) {
      json += `"x-correlation-id": ${typeof this.xCorrelationId === 'number' || typeof this.xCorrelationId === 'boolean' ? this.xCorrelationId : JSON.stringify(this.xCorrelationId)},`;
    }
    if(this.xTenantId !== undefined) {
      json += `"x-tenant-id": ${typeof this.xTenantId === 'number' || typeof this.xTenantId === 'boolean' ? this.xTenantId : JSON.stringify(this.xTenantId)},`;
    }
    if(this.xTimestamp !== undefined) {
      json += `"x-timestamp": ${typeof this.xTimestamp === 'number' || typeof this.xTimestamp === 'boolean' ? this.xTimestamp : JSON.stringify(this.xTimestamp)},`;
    }
    if(this.xNotificationType !== undefined) {
      json += `"x-notification-type": ${typeof this.xNotificationType === 'number' || typeof this.xNotificationType === 'boolean' ? this.xNotificationType : JSON.stringify(this.xNotificationType)},`;
    }
    if(this.xTemplateId !== undefined) {
      json += `"x-template-id": ${typeof this.xTemplateId === 'number' || typeof this.xTemplateId === 'boolean' ? this.xTemplateId : JSON.stringify(this.xTemplateId)},`;
    }
    if(this.xChannelPreference !== undefined) {
      json += `"x-channel-preference": ${typeof this.xChannelPreference === 'number' || typeof this.xChannelPreference === 'boolean' ? this.xChannelPreference : JSON.stringify(this.xChannelPreference)},`;
    }
    if(this.xDeliveryAttempt !== undefined) {
      json += `"x-delivery-attempt": ${typeof this.xDeliveryAttempt === 'number' || typeof this.xDeliveryAttempt === 'boolean' ? this.xDeliveryAttempt : JSON.stringify(this.xDeliveryAttempt)},`;
    }
    if(this.xScheduledTime !== undefined) {
      json += `"x-scheduled-time": ${typeof this.xScheduledTime === 'number' || typeof this.xScheduledTime === 'boolean' ? this.xScheduledTime : JSON.stringify(this.xScheduledTime)},`;
    }
    if(this.xProvider !== undefined) {
      json += `"x-provider": ${typeof this.xProvider === 'number' || typeof this.xProvider === 'boolean' ? this.xProvider : JSON.stringify(this.xProvider)},`;
    }
    if(this.xLanguage !== undefined) {
      json += `"x-language": ${typeof this.xLanguage === 'number' || typeof this.xLanguage === 'boolean' ? this.xLanguage : JSON.stringify(this.xLanguage)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-notification-type","x-template-id","x-channel-preference","x-delivery-attempt","x-scheduled-time","x-provider","x-language","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): NotificationSentHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new NotificationSentHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"];
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"];
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"];
    }
    if (obj["x-notification-type"] !== undefined) {
      instance.xNotificationType = obj["x-notification-type"];
    }
    if (obj["x-template-id"] !== undefined) {
      instance.xTemplateId = obj["x-template-id"];
    }
    if (obj["x-channel-preference"] !== undefined) {
      instance.xChannelPreference = obj["x-channel-preference"];
    }
    if (obj["x-delivery-attempt"] !== undefined) {
      instance.xDeliveryAttempt = obj["x-delivery-attempt"];
    }
    if (obj["x-scheduled-time"] !== undefined) {
      instance.xScheduledTime = obj["x-scheduled-time"];
    }
    if (obj["x-provider"] !== undefined) {
      instance.xProvider = obj["x-provider"];
    }
    if (obj["x-language"] !== undefined) {
      instance.xLanguage = obj["x-language"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-notification-type","x-template-id","x-channel-preference","x-delivery-attempt","x-scheduled-time","x-provider","x-language","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-notification-type"],"properties":{"x-notification-type":{"type":"string","enum":["email","sms","push","webhook"],"description":"Type of notification sent"},"x-template-id":{"type":"string","description":"Template used for notification"},"x-channel-preference":{"type":"string","enum":["email","sms","push","none"],"description":"User's preferred notification channel"},"x-delivery-attempt":{"type":"integer","minimum":1,"maximum":3,"default":1,"description":"Delivery attempt number"},"x-scheduled-time":{"type":"string","format":"date-time","description":"When notification was scheduled to be sent"},"x-provider":{"type":"string","enum":["sendgrid","twilio","firebase","custom"],"description":"Notification service provider"}}},{"type":"object","properties":{"x-language":{"type":"string","pattern":"^[a-z]{2}(-[A-Z]{2})?$","description":"Language code (e.g., en-US, fr-FR)","default":"en-US"}}}],"$id":"NotificationSentHeaders","$schema":"http://json-schema.org/draft-07/schema"};
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    const {data, ajvValidatorFunction} = context ?? {};
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const validate = ajvValidatorFunction ?? this.createValidator(context)
    return {
      valid: validate(parsedData),
      errors: validate.errors ?? undefined,
    };
  }
  public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
    const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
    addFormats(ajvInstance);
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { NotificationSentHeaders };