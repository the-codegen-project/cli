import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectWithFormatsInterface {
  email?: string
  website?: string
  userId?: string
  birthDate?: Date
  lastLogin?: Date
  serverIp?: string
  additionalProperties?: Record<string, any>
}
/**
 * Object with multiple format-validated properties
 */
class ObjectWithFormats {
  private _email?: string;
  private _website?: string;
  private _userId?: string;
  private _birthDate?: Date;
  private _lastLogin?: Date;
  private _serverIp?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ObjectWithFormatsInterface) {
    this._email = input.email;
    this._website = input.website;
    this._userId = input.userId;
    this._birthDate = input.birthDate;
    this._lastLogin = input.lastLogin;
    this._serverIp = input.serverIp;
    this._additionalProperties = input.additionalProperties;
  }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get website(): string | undefined { return this._website; }
  set website(website: string | undefined) { this._website = website; }

  get userId(): string | undefined { return this._userId; }
  set userId(userId: string | undefined) { this._userId = userId; }

  get birthDate(): Date | undefined { return this._birthDate; }
  set birthDate(birthDate: Date | undefined) { this._birthDate = birthDate; }

  get lastLogin(): Date | undefined { return this._lastLogin; }
  set lastLogin(lastLogin: Date | undefined) { this._lastLogin = lastLogin; }

  get serverIp(): string | undefined { return this._serverIp; }
  set serverIp(serverIp: string | undefined) { this._serverIp = serverIp; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.email !== undefined) {
      json["email"] = this.email;
    }
    if(this.website !== undefined) {
      json["website"] = this.website;
    }
    if(this.userId !== undefined) {
      json["userId"] = this.userId;
    }
    if(this.birthDate !== undefined) {
      json["birthDate"] = this.birthDate;
    }
    if(this.lastLogin !== undefined) {
      json["lastLogin"] = this.lastLogin;
    }
    if(this.serverIp !== undefined) {
      json["serverIp"] = this.serverIp;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["email","website","userId","birthDate","lastLogin","serverIp","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectWithFormats {
    const instance = new ObjectWithFormats({} as any);

    if (obj["email"] !== undefined) {
      instance.email = obj["email"] as string;
    }
    if (obj["website"] !== undefined) {
      instance.website = obj["website"] as string;
    }
    if (obj["userId"] !== undefined) {
      instance.userId = obj["userId"] as string;
    }
    if (obj["birthDate"] !== undefined) {
      instance.birthDate = obj["birthDate"] == null ? undefined : new Date(obj["birthDate"] as string);
    }
    if (obj["lastLogin"] !== undefined) {
      instance.lastLogin = obj["lastLogin"] == null ? undefined : new Date(obj["lastLogin"] as string);
    }
    if (obj["serverIp"] !== undefined) {
      instance.serverIp = obj["serverIp"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["email","website","userId","birthDate","lastLogin","serverIp","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ObjectWithFormats {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectWithFormats.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"email":{"type":"string","format":"email"},"website":{"type":"string","format":"uri"},"userId":{"type":"string","format":"uuid"},"birthDate":{"type":"string","format":"date"},"lastLogin":{"type":"string","format":"date-time"},"serverIp":{"type":"string","format":"ipv4"}},"description":"Object with multiple format-validated properties","$id":"ObjectWithFormats"};
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
export { ObjectWithFormats, ObjectWithFormatsInterface };