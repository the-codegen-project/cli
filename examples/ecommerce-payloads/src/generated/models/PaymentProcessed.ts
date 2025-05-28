import {Currency} from './Currency';
import {PaymentStatus} from './PaymentStatus';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class PaymentProcessed {
  private _paymentId: string;
  private _orderId: string;
  private _amount: number;
  private _currency: Currency;
  private _status: PaymentStatus;
  private _processorResponse?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    paymentId: string,
    orderId: string,
    amount: number,
    currency: Currency,
    status: PaymentStatus,
    processorResponse?: Record<string, any>,
    additionalProperties?: Record<string, any>,
  }) {
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

  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  get status(): PaymentStatus { return this._status; }
  set status(status: PaymentStatus) { this._status = status; }

  get processorResponse(): Record<string, any> | undefined { return this._processorResponse; }
  set processorResponse(processorResponse: Record<string, any> | undefined) { this._processorResponse = processorResponse; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.paymentId !== undefined) {
      json += `"paymentId": ${typeof this.paymentId === 'number' || typeof this.paymentId === 'boolean' ? this.paymentId : JSON.stringify(this.paymentId)},`;
    }
    if(this.orderId !== undefined) {
      json += `"orderId": ${typeof this.orderId === 'number' || typeof this.orderId === 'boolean' ? this.orderId : JSON.stringify(this.orderId)},`;
    }
    if(this.amount !== undefined) {
      json += `"amount": ${typeof this.amount === 'number' || typeof this.amount === 'boolean' ? this.amount : JSON.stringify(this.amount)},`;
    }
    if(this.currency !== undefined) {
      json += `"currency": ${typeof this.currency === 'number' || typeof this.currency === 'boolean' ? this.currency : JSON.stringify(this.currency)},`;
    }
    if(this.status !== undefined) {
      json += `"status": ${typeof this.status === 'number' || typeof this.status === 'boolean' ? this.status : JSON.stringify(this.status)},`;
    }
    if(this.processorResponse !== undefined) {
      json += `"processorResponse": ${typeof this.processorResponse === 'number' || typeof this.processorResponse === 'boolean' ? this.processorResponse : JSON.stringify(this.processorResponse)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["paymentId","orderId","amount","currency","status","processorResponse","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PaymentProcessed {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PaymentProcessed({} as any);

    if (obj["paymentId"] !== undefined) {
      instance.paymentId = obj["paymentId"];
    }
    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"];
    }
    if (obj["amount"] !== undefined) {
      instance.amount = obj["amount"];
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"];
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"];
    }
    if (obj["processorResponse"] !== undefined) {
      instance.processorResponse = obj["processorResponse"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["paymentId","orderId","amount","currency","status","processorResponse","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["paymentId","orderId","amount","currency","status"],"properties":{"paymentId":{"type":"string","format":"uuid"},"orderId":{"type":"string","format":"uuid"},"amount":{"type":"number","minimum":0},"currency":{"type":"string","enum":["USD","EUR","GBP"],"description":"Currency code"},"status":{"type":"string","enum":["success","failed","pending"],"description":"Payment processing status"},"processorResponse":{"type":"object","additionalProperties":true,"description":"Additional metadata"}},"$id":"PaymentProcessed"};
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
export { PaymentProcessed };