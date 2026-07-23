import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface BankAccountInterface {
  id?: string
  iban?: string
  isDefault?: boolean
  additionalProperties?: Record<string, any>
}
class BankAccount {
  private _id?: string;
  private _iban?: string;
  private _isDefault?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: BankAccountInterface) {
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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.iban !== undefined) {
      json["iban"] = this.iban;
    }
    if(this.isDefault !== undefined) {
      json["isDefault"] = this.isDefault;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","iban","isDefault","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): BankAccount {
    const instance = new BankAccount({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["iban"] !== undefined) {
      instance.iban = obj["iban"] as string;
    }
    if (obj["isDefault"] !== undefined) {
      instance.isDefault = obj["isDefault"] as boolean;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","iban","isDefault","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): BankAccount {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return BankAccount.fromJson(obj as Record<string, unknown>);
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
export { BankAccount, BankAccountInterface };