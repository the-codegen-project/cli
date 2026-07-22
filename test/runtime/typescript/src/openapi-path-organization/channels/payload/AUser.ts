import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface AUserInterface {
  id?: number
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  userStatus?: number
  additionalProperties?: Record<string, any>
}
/**
 * A User who is purchasing from the pet store
 */
class AUser {
  private _id?: number;
  private _username?: string;
  private _firstName?: string;
  private _lastName?: string;
  private _email?: string;
  private _password?: string;
  private _phone?: string;
  private _userStatus?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: AUserInterface) {
    this._id = input.id;
    this._username = input.username;
    this._firstName = input.firstName;
    this._lastName = input.lastName;
    this._email = input.email;
    this._password = input.password;
    this._phone = input.phone;
    this._userStatus = input.userStatus;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): number | undefined { return this._id; }
  set id(id: number | undefined) { this._id = id; }

  get username(): string | undefined { return this._username; }
  set username(username: string | undefined) { this._username = username; }

  get firstName(): string | undefined { return this._firstName; }
  set firstName(firstName: string | undefined) { this._firstName = firstName; }

  get lastName(): string | undefined { return this._lastName; }
  set lastName(lastName: string | undefined) { this._lastName = lastName; }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get password(): string | undefined { return this._password; }
  set password(password: string | undefined) { this._password = password; }

  get phone(): string | undefined { return this._phone; }
  set phone(phone: string | undefined) { this._phone = phone; }

  /**
   * User Status
   */
  get userStatus(): number | undefined { return this._userStatus; }
  set userStatus(userStatus: number | undefined) { this._userStatus = userStatus; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.username !== undefined) {
      json["username"] = this.username;
    }
    if(this.firstName !== undefined) {
      json["firstName"] = this.firstName;
    }
    if(this.lastName !== undefined) {
      json["lastName"] = this.lastName;
    }
    if(this.email !== undefined) {
      json["email"] = this.email;
    }
    if(this.password !== undefined) {
      json["password"] = this.password;
    }
    if(this.phone !== undefined) {
      json["phone"] = this.phone;
    }
    if(this.userStatus !== undefined) {
      json["userStatus"] = this.userStatus;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","username","firstName","lastName","email","password","phone","userStatus","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): AUser {
    const instance = new AUser({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as number;
    }
    if (obj["username"] !== undefined) {
      instance.username = obj["username"] as string;
    }
    if (obj["firstName"] !== undefined) {
      instance.firstName = obj["firstName"] as string;
    }
    if (obj["lastName"] !== undefined) {
      instance.lastName = obj["lastName"] as string;
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"] as string;
    }
    if (obj["password"] !== undefined) {
      instance.password = obj["password"] as string;
    }
    if (obj["phone"] !== undefined) {
      instance.phone = obj["phone"] as string;
    }
    if (obj["userStatus"] !== undefined) {
      instance.userStatus = obj["userStatus"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","username","firstName","lastName","email","password","phone","userStatus","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): AUser {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return AUser.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"title":"a User","description":"A User who is purchasing from the pet store","type":"object","properties":{"id":{"type":"integer","format":"int64"},"username":{"type":"string"},"firstName":{"type":"string"},"lastName":{"type":"string"},"email":{"type":"string"},"password":{"type":"string"},"phone":{"type":"string"},"userStatus":{"type":"integer","format":"int32","description":"User Status"}},"xml":{"name":"User"},"$id":"User","$schema":"http://json-schema.org/draft-07/schema"};
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
export { AUser, AUserInterface };