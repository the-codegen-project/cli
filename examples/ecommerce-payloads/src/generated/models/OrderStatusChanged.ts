import {OrderStatus} from './OrderStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderStatusChanged {
  private _orderId: string;
  private _previousStatus: OrderStatus;
  private _newStatus: OrderStatus;
  private _timestamp: string;
  private _reason?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    timestamp: string,
    reason?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  get timestamp(): string { return this._timestamp; }
  set timestamp(timestamp: string) { this._timestamp = timestamp; }

  get reason(): string | undefined { return this._reason; }
  set reason(reason: string | undefined) { this._reason = reason; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.orderId !== undefined) {
      json += `"orderId": ${typeof this.orderId === 'number' || typeof this.orderId === 'boolean' ? this.orderId : JSON.stringify(this.orderId)},`;
    }
    if(this.previousStatus !== undefined) {
      json += `"previousStatus": ${typeof this.previousStatus === 'number' || typeof this.previousStatus === 'boolean' ? this.previousStatus : JSON.stringify(this.previousStatus)},`;
    }
    if(this.newStatus !== undefined) {
      json += `"newStatus": ${typeof this.newStatus === 'number' || typeof this.newStatus === 'boolean' ? this.newStatus : JSON.stringify(this.newStatus)},`;
    }
    if(this.timestamp !== undefined) {
      json += `"timestamp": ${typeof this.timestamp === 'number' || typeof this.timestamp === 'boolean' ? this.timestamp : JSON.stringify(this.timestamp)},`;
    }
    if(this.reason !== undefined) {
      json += `"reason": ${typeof this.reason === 'number' || typeof this.reason === 'boolean' ? this.reason : JSON.stringify(this.reason)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","previousStatus","newStatus","timestamp","reason","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderStatusChanged {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderStatusChanged({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"];
    }
    if (obj["previousStatus"] !== undefined) {
      instance.previousStatus = obj["previousStatus"];
    }
    if (obj["newStatus"] !== undefined) {
      instance.newStatus = obj["newStatus"];
    }
    if (obj["timestamp"] !== undefined) {
      instance.timestamp = obj["timestamp"];
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","previousStatus","newStatus","timestamp","reason","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","previousStatus","newStatus","timestamp"],"properties":{"orderId":{"type":"string","format":"uuid"},"previousStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"newStatus":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]},"timestamp":{"type":"string","format":"date-time"},"reason":{"type":"string","description":"Reason for status change"}},"$id":"OrderStatusChanged"};
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
export { OrderStatusChanged };