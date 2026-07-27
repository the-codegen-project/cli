import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface SmsNotificationInterface {
  recipientId: string
  message: string
  additionalProperties?: Record<string, any>
}
class SmsNotification {
  private _type: 'sms' = 'sms';
  private _recipientId: string;
  private _message: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: SmsNotificationInterface) {
    this._recipientId = input.recipientId;
    this._message = input.message;
    this._additionalProperties = input.additionalProperties;
  }

  get type(): 'sms' { return this._type; }

  get recipientId(): string { return this._recipientId; }
  set recipientId(recipientId: string) { this._recipientId = recipientId; }

  get message(): string { return this._message; }
  set message(message: string) { this._message = message; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.type !== undefined) {
      json["type"] = this.type;
    }
    if(this.recipientId !== undefined) {
      json["recipientId"] = this.recipientId;
    }
    if(this.message !== undefined) {
      json["message"] = this.message;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","message","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): SmsNotification {
    const instance = new SmsNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"] as string;
    }
    if (obj["message"] !== undefined) {
      instance.message = obj["message"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","message","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): SmsNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return SmsNotification.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","message"],"properties":{"type":{"const":"sms"},"recipientId":{"type":"string"},"message":{"type":"string","maxLength":160}}};
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
export { SmsNotification, SmsNotificationInterface };