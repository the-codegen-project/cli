import {LegacyNotificationPayloadLevelEnum} from './LegacyNotificationPayloadLevelEnum';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface LegacyNotificationInterface {
  message?: string
  level?: LegacyNotificationPayloadLevelEnum
  additionalProperties?: Record<string, any>
}
/**
 * Legacy notification payload - use NewNotificationPayload instead
 */
class LegacyNotification {
  private _message?: string;
  private _level?: LegacyNotificationPayloadLevelEnum;
  private _additionalProperties?: Record<string, any>;

  constructor(input: LegacyNotificationInterface) {
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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.message !== undefined) {
      json["message"] = this.message;
    }
    if(this.level !== undefined) {
      json["level"] = this.level;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["message","level","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): LegacyNotification {
    const instance = new LegacyNotification({} as any);

    if (obj["message"] !== undefined) {
      instance.message = obj["message"] as string;
    }
    if (obj["level"] !== undefined) {
      instance.level = obj["level"] as LegacyNotificationPayloadLevelEnum;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["message","level","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): LegacyNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return LegacyNotification.fromJson(obj as Record<string, unknown>);
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
export { LegacyNotification, LegacyNotificationInterface };