import {OrderStatus} from './OrderStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface OrderUpdatedInterface {
  orderId: string
  status: OrderStatus
  updatedAt: Date
  reason?: string
  updatedFields?: string[]
  additionalProperties?: Record<string, any>
}
class OrderUpdated {
  private _orderId: string;
  private _status: OrderStatus;
  private _updatedAt: Date;
  private _reason?: string;
  private _updatedFields?: string[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderUpdatedInterface) {
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

  get updatedAt(): Date { return this._updatedAt; }
  set updatedAt(updatedAt: Date) { this._updatedAt = updatedAt; }

  get reason(): string | undefined { return this._reason; }
  set reason(reason: string | undefined) { this._reason = reason; }

  get updatedFields(): string[] | undefined { return this._updatedFields; }
  set updatedFields(updatedFields: string[] | undefined) { this._updatedFields = updatedFields; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.orderId !== undefined) {
      json["orderId"] = this.orderId;
    }
    if(this.status !== undefined) {
      json["status"] = this.status;
    }
    if(this.updatedAt !== undefined) {
      json["updatedAt"] = this.updatedAt;
    }
    if(this.reason !== undefined) {
      json["reason"] = this.reason;
    }
    if(this.updatedFields !== undefined) {
      json["updatedFields"] = this.updatedFields;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","status","updatedAt","reason","updatedFields","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderUpdated {
    const instance = new OrderUpdated({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"] as string;
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"] as OrderStatus;
    }
    if (obj["updatedAt"] !== undefined) {
      instance.updatedAt = new Date(obj["updatedAt"] as string);
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"] as string;
    }
    if (obj["updatedFields"] !== undefined) {
      instance.updatedFields = obj["updatedFields"] as string[];
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","status","updatedAt","reason","updatedFields","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderUpdated {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderUpdated.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","status","updatedAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"status":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled"]},"updatedAt":{"type":"string","format":"date-time"},"reason":{"type":"string"},"updatedFields":{"type":"array","items":{"type":"string"}}},"$id":"OrderUpdated"};
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
export { OrderUpdated, OrderUpdatedInterface };