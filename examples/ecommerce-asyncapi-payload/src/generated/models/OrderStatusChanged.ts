import {OrderStatus} from './OrderStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface OrderStatusChangedInterface {
  orderId: string
  previousStatus: OrderStatus
  newStatus: OrderStatus
  timestamp: Date
  reason?: string
  additionalProperties?: Record<string, any>
}
class OrderStatusChanged {
  private _orderId: string;
  private _previousStatus: OrderStatus;
  private _newStatus: OrderStatus;
  private _timestamp: Date;
  private _reason?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderStatusChangedInterface) {
    this._orderId = input.orderId;
    this._previousStatus = input.previousStatus;
    this._newStatus = input.newStatus;
    this._timestamp = input.timestamp;
    this._reason = input.reason;
    this._additionalProperties = input.additionalProperties;
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get previousStatus(): OrderStatus { return this._previousStatus; }
  set previousStatus(previousStatus: OrderStatus) { this._previousStatus = previousStatus; }

  get newStatus(): OrderStatus { return this._newStatus; }
  set newStatus(newStatus: OrderStatus) { this._newStatus = newStatus; }

  get timestamp(): Date { return this._timestamp; }
  set timestamp(timestamp: Date) { this._timestamp = timestamp; }

  /**
   * Reason for status change
   */
  get reason(): string | undefined { return this._reason; }
  set reason(reason: string | undefined) { this._reason = reason; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.orderId !== undefined) {
      json["orderId"] = this.orderId;
    }
    if(this.previousStatus !== undefined) {
      json["previousStatus"] = this.previousStatus;
    }
    if(this.newStatus !== undefined) {
      json["newStatus"] = this.newStatus;
    }
    if(this.timestamp !== undefined) {
      json["timestamp"] = this.timestamp;
    }
    if(this.reason !== undefined) {
      json["reason"] = this.reason;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","previousStatus","newStatus","timestamp","reason","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderStatusChanged {
    const instance = new OrderStatusChanged({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"] as string;
    }
    if (obj["previousStatus"] !== undefined) {
      instance.previousStatus = obj["previousStatus"] as OrderStatus;
    }
    if (obj["newStatus"] !== undefined) {
      instance.newStatus = obj["newStatus"] as OrderStatus;
    }
    if (obj["timestamp"] !== undefined) {
      instance.timestamp = new Date(obj["timestamp"] as string);
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","previousStatus","newStatus","timestamp","reason","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderStatusChanged {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderStatusChanged.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","previousStatus","newStatus","timestamp"],"properties":{"orderId":{"type":"string","format":"uuid"},"previousStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"newStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"timestamp":{"type":"string","format":"date-time"},"reason":{"type":"string","description":"Reason for status change"}},"$id":"OrderStatusChanged"};
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
export { OrderStatusChanged, OrderStatusChangedInterface };