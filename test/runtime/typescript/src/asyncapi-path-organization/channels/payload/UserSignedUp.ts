import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface UserSignedUpInterface {
  displayName?: string
  email?: string
  additionalProperties?: Record<string, any>
}
/**
 * Payload for user signup events containing user registration details
 */
class UserSignedUp {
  private _displayName?: string;
  private _email?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: UserSignedUpInterface) {
    this._displayName = input.displayName;
    this._email = input.email;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Name of the user
   */
  get displayName(): string | undefined { return this._displayName; }
  set displayName(displayName: string | undefined) { this._displayName = displayName; }

  /**
   * Email of the user
   */
  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.displayName !== undefined) {
      json["display_name"] = this.displayName;
    }
    if(this.email !== undefined) {
      json["email"] = this.email;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["display_name","email","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): UserSignedUp {
    const instance = new UserSignedUp({} as any);

    if (obj["display_name"] !== undefined) {
      instance.displayName = obj["display_name"] as string;
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["display_name","email","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): UserSignedUp {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return UserSignedUp.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","description":"Payload for user signup events containing user registration details","properties":{"display_name":{"type":"string","description":"Name of the user"},"email":{"type":"string","format":"email","description":"Email of the user"}},"$id":"UserSignedUp"};
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