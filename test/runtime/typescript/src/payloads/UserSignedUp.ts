import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class UserSignedUp {
  private _displayName?: string;
  private _email?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    displayName?: string,
    email?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._displayName = input.displayName;
    this._email = input.email;
    this._additionalProperties = input.additionalProperties;
  }

  get displayName(): string | undefined { return this._displayName; }
  set displayName(displayName: string | undefined) { this._displayName = displayName; }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.displayName !== undefined) {
      json += `"display_name": ${typeof this.displayName === 'number' || typeof this.displayName === 'boolean' ? this.displayName : JSON.stringify(this.displayName)},`;
    }
    if(this.email !== undefined) {
      json += `"email": ${typeof this.email === 'number' || typeof this.email === 'boolean' ? this.email : JSON.stringify(this.email)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["display_name","email","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): UserSignedUp {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new UserSignedUp({} as any);

    if (obj["display_name"] !== undefined) {
      instance.displayName = obj["display_name"];
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["display_name","email","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"display_name":{"type":"string","description":"Name of the user"},"email":{"type":"string","format":"email","description":"Email of the user"}},"$id":"UserSignedUp"};
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
export { UserSignedUp };