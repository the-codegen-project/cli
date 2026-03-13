import {LegacyNotificationPayloadLevelEnum} from './LegacyNotificationPayloadLevelEnum';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Legacy notification payload - use NewNotificationPayload instead
 */
class LegacyNotification {
  private _message?: string;
  private _level?: LegacyNotificationPayloadLevelEnum;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    message?: string,
    level?: LegacyNotificationPayloadLevelEnum,
    additionalProperties?: Record<string, any>,
  }) {
    this._message = input.message;
    this._level = input.level;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * The notification message
   */
  get message(): string | undefined { return this._message; }
  set message(message: string | undefined) { this._message = message; }

  /**
   * Notification severity level
   */
  get level(): LegacyNotificationPayloadLevelEnum | undefined { return this._level; }
  set level(level: LegacyNotificationPayloadLevelEnum | undefined) { this._level = level; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.message !== undefined) {
      json += `"message": ${typeof this.message === 'number' || typeof this.message === 'boolean' ? this.message : JSON.stringify(this.message)},`;
    }
    if(this.level !== undefined) {
      json += `"level": ${typeof this.level === 'number' || typeof this.level === 'boolean' ? this.level : JSON.stringify(this.level)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["message","level","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): LegacyNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new LegacyNotification({} as any);

    if (obj["message"] !== undefined) {
      instance.message = obj["message"];
    }
    if (obj["level"] !== undefined) {
      instance.level = obj["level"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["message","level","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","description":"Legacy notification payload - use NewNotificationPayload instead","deprecated":true,"properties":{"message":{"type":"string","description":"The notification message"},"level":{"type":"string","enum":["info","warning","error"],"description":"Notification severity level"}},"$id":"LegacyNotification"};
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    const {data, ajvValidatorFunction} = context ?? {};
    // Intentionally parse JSON strings to support validation of marshalled output.
    // Example: validate({data: marshal(obj)}) works because marshal returns JSON string.
    // Note: String 'true' will be coerced to boolean true due to JSON.parse.
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
export { LegacyNotification };