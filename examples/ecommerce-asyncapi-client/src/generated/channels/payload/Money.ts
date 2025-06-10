import {Currency} from './Currency';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class Money {
  private _amount: number;
  private _currency: Currency;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    amount: number,
    currency: Currency,
    additionalProperties?: Record<string, any>,
  }) {
    this._amount = input.amount;
    this._currency = input.currency;
    this._additionalProperties = input.additionalProperties;
  }

  get amount(): number { return this._amount; }
  set amount(amount: number) { this._amount = amount; }

  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.amount !== undefined) {
      json += `"amount": ${typeof this.amount === 'number' || typeof this.amount === 'boolean' ? this.amount : JSON.stringify(this.amount)},`;
    }
    if(this.currency !== undefined) {
      json += `"currency": ${typeof this.currency === 'number' || typeof this.currency === 'boolean' ? this.currency : JSON.stringify(this.currency)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["amount","currency","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): Money {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new Money({} as any);

    if (obj["amount"] !== undefined) {
      instance.amount = obj["amount"];
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["amount","currency","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}};
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
export { Money };