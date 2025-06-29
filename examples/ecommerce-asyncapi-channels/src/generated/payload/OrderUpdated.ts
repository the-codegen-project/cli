import {OrderStatus} from './OrderStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderUpdated {
  private _orderId: string;
  private _status: OrderStatus;
  private _updatedAt: string;
  private _reason?: string;
  private _updatedFields?: string[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    status: OrderStatus,
    updatedAt: string,
    reason?: string,
    updatedFields?: string[],
    additionalProperties?: Record<string, any>,
  }) {
    this._orderId = input.orderId;
    this._status = input.status;
    this._updatedAt = input.updatedAt;
    this._reason = input.reason;
    this._updatedFields = input.updatedFields;
    this._additionalProperties = input.additionalProperties;
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get status(): OrderStatus { return this._status; }
  set status(status: OrderStatus) { this._status = status; }

  get updatedAt(): string { return this._updatedAt; }
  set updatedAt(updatedAt: string) { this._updatedAt = updatedAt; }

  get reason(): string | undefined { return this._reason; }
  set reason(reason: string | undefined) { this._reason = reason; }

  get updatedFields(): string[] | undefined { return this._updatedFields; }
  set updatedFields(updatedFields: string[] | undefined) { this._updatedFields = updatedFields; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.orderId !== undefined) {
      json += `"orderId": ${typeof this.orderId === 'number' || typeof this.orderId === 'boolean' ? this.orderId : JSON.stringify(this.orderId)},`;
    }
    if(this.status !== undefined) {
      json += `"status": ${typeof this.status === 'number' || typeof this.status === 'boolean' ? this.status : JSON.stringify(this.status)},`;
    }
    if(this.updatedAt !== undefined) {
      json += `"updatedAt": ${typeof this.updatedAt === 'number' || typeof this.updatedAt === 'boolean' ? this.updatedAt : JSON.stringify(this.updatedAt)},`;
    }
    if(this.reason !== undefined) {
      json += `"reason": ${typeof this.reason === 'number' || typeof this.reason === 'boolean' ? this.reason : JSON.stringify(this.reason)},`;
    }
    if(this.updatedFields !== undefined) {
      let updatedFieldsJsonValues: any[] = [];
      for (const unionItem of this.updatedFields) {
        updatedFieldsJsonValues.push(`${typeof unionItem === 'number' || typeof unionItem === 'boolean' ? unionItem : JSON.stringify(unionItem)}`);
      }
      json += `"updatedFields": [${updatedFieldsJsonValues.join(',')}],`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","status","updatedAt","reason","updatedFields","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderUpdated {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderUpdated({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"];
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"];
    }
    if (obj["updatedAt"] !== undefined) {
      instance.updatedAt = obj["updatedAt"];
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"];
    }
    if (obj["updatedFields"] !== undefined) {
      instance.updatedFields = obj["updatedFields"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","status","updatedAt","reason","updatedFields","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","status","updatedAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled"]},"updatedAt":{"type":"string","format":"date-time"},"reason":{"type":"string"},"updatedFields":{"type":"array","items":{"type":"string"}}},"$id":"OrderUpdated"};
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
export { OrderUpdated };