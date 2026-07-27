import {Currency} from './Currency';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface MoneyInterface {
  amount: number
  currency: Currency
  additionalProperties?: Record<string, any>
}
class Money {
  private _amount: number;
  private _currency: Currency;
  private _additionalProperties?: Record<string, any>;

  constructor(input: MoneyInterface) {
    this._amount = input.amount;
    this._currency = input.currency;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Amount in smallest currency unit (e.g., cents for USD)
   */
  get amount(): number { return this._amount; }
  set amount(amount: number) { this._amount = amount; }

  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.amount !== undefined) {
      json["amount"] = this.amount;
    }
    if(this.currency !== undefined) {
      json["currency"] = this.currency;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["amount","currency","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): Money {
    const instance = new Money({} as any);

    if (obj["amount"] !== undefined) {
      instance.amount = obj["amount"] as number;
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"] as Currency;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["amount","currency","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): Money {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return Money.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}};
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
export { Money, MoneyInterface };