import {Address} from './Address';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface UserInterface {
  id?: string
  displayName?: string
  address?: Address
  additionalProperties?: Record<string, any>
}
class User {
  private _id?: string;
  private _displayName?: string;
  private _address?: Address;
  private _additionalProperties?: Record<string, any>;

  constructor(input: UserInterface) {
    this._id = input.id;
    this._displayName = input.displayName;
    this._address = input.address;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  get displayName(): string | undefined { return this._displayName; }
  set displayName(displayName: string | undefined) { this._displayName = displayName; }

  get address(): Address | undefined { return this._address; }
  set address(address: Address | undefined) { this._address = address; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.displayName !== undefined) {
      json["displayName"] = this.displayName;
    }
    if(this.address !== undefined) {
      json["address"] = this.address && typeof this.address === 'object' && 'toJson' in this.address && typeof this.address.toJson === 'function' ? this.address.toJson() : this.address;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","displayName","address","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): User {
    const instance = new User({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["displayName"] !== undefined) {
      instance.displayName = obj["displayName"] as string;
    }
    if (obj["address"] !== undefined) {
      instance.address = Address.fromJson(obj["address"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","displayName","address","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): User {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return User.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"id":{"type":"string"},"displayName":{"type":"string"},"address":{"type":"object","properties":{"street":{"type":"string"},"city":{"type":"string"}}}}};
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
export { User, UserInterface };