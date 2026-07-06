import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class BankAccountsItem {
  private _id?: string;
  private _iban?: string;
  private _isDefault?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id?: string,
    iban?: string,
    isDefault?: boolean,
    additionalProperties?: Record<string, any>,
  }) {
    this._id = input.id;
    this._iban = input.iban;
    this._isDefault = input.isDefault;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  get iban(): string | undefined { return this._iban; }
  set iban(iban: string | undefined) { this._iban = iban; }

  get isDefault(): boolean | undefined { return this._isDefault; }
  set isDefault(isDefault: boolean | undefined) { this._isDefault = isDefault; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.iban !== undefined) {
      json += `"iban": ${typeof this.iban === 'number' || typeof this.iban === 'boolean' ? this.iban : JSON.stringify(this.iban)},`;
    }
    if(this.isDefault !== undefined) {
      json += `"isDefault": ${typeof this.isDefault === 'number' || typeof this.isDefault === 'boolean' ? this.isDefault : JSON.stringify(this.isDefault)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","iban","isDefault","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): BankAccountsItem {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new BankAccountsItem({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["iban"] !== undefined) {
      instance.iban = obj["iban"];
    }
    if (obj["isDefault"] !== undefined) {
      instance.isDefault = obj["isDefault"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","iban","isDefault","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"id":{"type":"string"},"iban":{"type":"string"},"isDefault":{"type":"boolean"}}};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { BankAccountsItem };