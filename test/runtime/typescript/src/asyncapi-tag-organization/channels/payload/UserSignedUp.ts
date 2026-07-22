import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface UserSignedUpInterface {
  displayName?: string
  email?: string
}
class UserSignedUp {
  private _displayName?: string;
  private _email?: string;

  constructor(input: UserSignedUpInterface) {
    this._displayName = input.displayName;
    this._email = input.email;
  }

  get displayName(): string | undefined { return this._displayName; }
  set displayName(displayName: string | undefined) { this._displayName = displayName; }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.displayName !== undefined) {
      json["displayName"] = this.displayName;
    }
    if(this.email !== undefined) {
      json["email"] = this.email;
    }
  
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): UserSignedUp {
    const instance = new UserSignedUp({} as any);

    if (obj["displayName"] !== undefined) {
      instance.displayName = obj["displayName"] as string;
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"] as string;
    }

  
    return instance;
  }

  public static unmarshal(json: string | object): UserSignedUp {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return UserSignedUp.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","additionalProperties":false,"properties":{"displayName":{"type":"string"},"email":{"type":"string","format":"email"}},"$id":"UserSignedUp"};
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
export { UserSignedUp, UserSignedUpInterface };