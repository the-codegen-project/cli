import {Currency} from './Currency';
import {PaymentStatus} from './PaymentStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface PaymentProcessedInterface {
  paymentId: string
  orderId: string
  amount: number
  currency: Currency
  status: PaymentStatus
  processorResponse?: Record<string, any>
  additionalProperties?: Record<string, any>
}
class PaymentProcessed {
  private _paymentId: string;
  private _orderId: string;
  private _amount: number;
  private _currency: Currency;
  private _status: PaymentStatus;
  private _processorResponse?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: PaymentProcessedInterface) {
    this._paymentId = input.paymentId;
    this._orderId = input.orderId;
    this._amount = input.amount;
    this._currency = input.currency;
    this._status = input.status;
    this._processorResponse = input.processorResponse;
    this._additionalProperties = input.additionalProperties;
  }

  get paymentId(): string { return this._paymentId; }
  set paymentId(paymentId: string) { this._paymentId = paymentId; }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get amount(): number { return this._amount; }
  set amount(amount: number) { this._amount = amount; }

  /**
   * Currency code
   */
  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  /**
   * Payment processing status
   */
  get status(): PaymentStatus { return this._status; }
  set status(status: PaymentStatus) { this._status = status; }

  /**
   * Additional metadata
   */
  get processorResponse(): Record<string, any> | undefined { return this._processorResponse; }
  set processorResponse(processorResponse: Record<string, any> | undefined) { this._processorResponse = processorResponse; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.paymentId !== undefined) {
      json["paymentId"] = this.paymentId;
    }
    if(this.orderId !== undefined) {
      json["orderId"] = this.orderId;
    }
    if(this.amount !== undefined) {
      json["amount"] = this.amount;
    }
    if(this.currency !== undefined) {
      json["currency"] = this.currency;
    }
    if(this.status !== undefined) {
      json["status"] = this.status;
    }
    if(this.processorResponse !== undefined) {
      const serializedMap: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(this.processorResponse)) {
        serializedMap[key] = value;
      }
      json["processorResponse"] = serializedMap;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["paymentId","orderId","amount","currency","status","processorResponse","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): PaymentProcessed {
    const instance = new PaymentProcessed({} as any);

    if (obj["paymentId"] !== undefined) {
      instance.paymentId = obj["paymentId"] as string;
    }
    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"] as string;
    }
    if (obj["amount"] !== undefined) {
      instance.amount = obj["amount"] as number;
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"] as Currency;
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"] as PaymentStatus;
    }
    if (obj["processorResponse"] !== undefined) {
      instance.processorResponse = obj["processorResponse"] == null
        ? undefined
        : obj["processorResponse"] as Record<string, any>;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["paymentId","orderId","amount","currency","status","processorResponse","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): PaymentProcessed {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return PaymentProcessed.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["paymentId","orderId","amount","currency","status"],"properties":{"paymentId":{"type":"string","format":"uuid"},"orderId":{"type":"string","format":"uuid"},"amount":{"type":"number","minimum":0},"currency":{"type":"string","enum":["USD","EUR","GBP"],"description":"Currency code"},"status":{"type":"string","enum":["success","failed","pending"],"description":"Payment processing status"},"processorResponse":{"type":"object","additionalProperties":true,"description":"Additional metadata"}},"$id":"PaymentProcessed"};
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
export { PaymentProcessed };
export type { PaymentProcessedInterface };