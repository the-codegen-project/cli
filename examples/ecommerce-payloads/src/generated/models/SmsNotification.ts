import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class SmsNotification {
  private _type: 'sms' = 'sms';
  private _recipientId: string;
  private _message: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    recipientId: string,
    message: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.type !== undefined) {
      json += `"type": ${typeof this.type === 'number' || typeof this.type === 'boolean' ? this.type : JSON.stringify(this.type)},`;
    }
    if(this.recipientId !== undefined) {
      json += `"recipientId": ${typeof this.recipientId === 'number' || typeof this.recipientId === 'boolean' ? this.recipientId : JSON.stringify(this.recipientId)},`;
    }
    if(this.message !== undefined) {
      json += `"message": ${typeof this.message === 'number' || typeof this.message === 'boolean' ? this.message : JSON.stringify(this.message)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","message","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): SmsNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new SmsNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"];
    }
    if (obj["message"] !== undefined) {
      instance.message = obj["message"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","message","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","message"],"properties":{"type":{"const":"sms"},"recipientId":{"type":"string"},"message":{"type":"string","maxLength":160}}};
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
export { SmsNotification };