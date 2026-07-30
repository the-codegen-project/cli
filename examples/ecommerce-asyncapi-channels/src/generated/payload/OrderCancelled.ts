import {Money} from './Money';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface OrderCancelledInterface {
  orderId: string
  reason: string
  cancelledAt: Date
  refundAmount?: Money
  additionalProperties?: Record<string, any>
}
class OrderCancelled {
  private _orderId: string;
  private _reason: string;
  private _cancelledAt: Date;
  private _refundAmount?: Money;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderCancelledInterface) {
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

  get cancelledAt(): Date { return this._cancelledAt; }
  set cancelledAt(cancelledAt: Date) { this._cancelledAt = cancelledAt; }

  get refundAmount(): Money | undefined { return this._refundAmount; }
  set refundAmount(refundAmount: Money | undefined) { this._refundAmount = refundAmount; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.orderId !== undefined) {
      json["orderId"] = this.orderId;
    }
    if(this.reason !== undefined) {
      json["reason"] = this.reason;
    }
    if(this.cancelledAt !== undefined) {
      json["cancelledAt"] = this.cancelledAt;
    }
    if(this.refundAmount !== undefined) {
      json["refundAmount"] = this.refundAmount && typeof this.refundAmount === 'object' && 'toJson' in this.refundAmount && typeof this.refundAmount.toJson === 'function' ? this.refundAmount.toJson() : this.refundAmount;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","reason","cancelledAt","refundAmount","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderCancelled {
    const instance = new OrderCancelled({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"] as string;
    }
    if (obj["reason"] !== undefined) {
      instance.reason = obj["reason"] as string;
    }
    if (obj["cancelledAt"] !== undefined) {
      instance.cancelledAt = new Date(obj["cancelledAt"] as string);
    }
    if (obj["refundAmount"] !== undefined) {
      instance.refundAmount = Money.fromJson(obj["refundAmount"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","reason","cancelledAt","refundAmount","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderCancelled {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderCancelled.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","reason","cancelledAt"],"properties":{"orderId":{"type":"string","format":"uuid"},"reason":{"type":"string"},"cancelledAt":{"type":"string","format":"date-time"},"refundAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}}},"$id":"OrderCancelled"};
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
    // `ajv-formats` is CommonJS; its default import is the module namespace under
    // `moduleResolution: node16`/`nodenext`, so unwrap `.default` when present.
    const addFormats = ((addFormatsModule as unknown as {default?: unknown}).default ?? addFormatsModule) as (ajv: Ajv) => Ajv;
    addFormats(ajvInstance);
  
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { OrderCancelled };
export type { OrderCancelledInterface };