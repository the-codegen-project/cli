import {Money} from './Money';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderCancelled {
  private _orderId: string;
  private _reason: string;
  private _cancelledAt: string;
  private _refundAmount?: Money;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    reason: string,
    cancelledAt: string,
    refundAmount?: Money,
    additionalProperties?: Record<string, any>,
  }) {
    this._orderId = input.orderId;
    this._reason = input.reason;
    this._cancelledAt = input.cancelledAt;
    this._refundAmount = input.refundAmount;
    this._additionalProperties = input.additionalProperties;
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get reason(): string { return this._reason; }
  set reason(reason: string) { this._reason = reason; }

  get cancelledAt(): string { return this._cancelledAt; }
  set cancelledAt(cancelledAt: string) { this._cancelledAt = cancelledAt; }

  get refundAmount(): Money | undefined { return this._refundAmount; }
  set refundAmount(refundAmount: Money | undefined) { this._refundAmount = refundAmount; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.orderId !== undefined) {
      json += `"orderId": ${typeof this.orderId === 'number' || typeof this.orderId === 'boolean' ? this.orderId : JSON.stringify(this.orderId)},`;
    }
    if(this.reason !== undefined) {
      json += `"reason": ${typeof this.reason === 'number' || typeof this.reason === 'boolean' ? this.reason : JSON.stringify(this.reason)},`;
    }
    if(this.cancelledAt !== undefined) {
      json += `"cancelledAt": ${typeof this.cancelledAt === 'number' || typeof this.cancelledAt === 'boolean' ? this.cancelledAt : JSON.stringify(this.cancelledAt)},`;
    }
    if(this.refundAmount !== undefined) {
      json += `"refundAmount": ${this.refundAmount.marshal()},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","reason","cancelledAt","refundAmount","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderCancelled {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderCancelled({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"];
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"];
    }
    if (obj["cancelledAt"] !== undefined) {
      instance.cancelledAt = obj["cancelledAt"];
    }
    if (obj["refundAmount"] !== undefined) {
      instance.refundAmount = Money.unmarshal(obj["refundAmount"]);
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","reason","cancelledAt","refundAmount","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","reason","cancelledAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"reason":{"type":"string"},"cancelledAt":{"type":"string","format":"date-time"},"refundAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}}},"$id":"OrderCancelled"};
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
export { OrderCancelled };