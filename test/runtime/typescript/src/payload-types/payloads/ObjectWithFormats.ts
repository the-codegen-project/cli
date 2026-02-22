import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class ObjectWithFormats {
  private _email?: string;
  private _website?: string;
  private _userId?: string;
  private _birthDate?: Date;
  private _lastLogin?: Date;
  private _serverIp?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    email?: string,
    website?: string,
    userId?: string,
    birthDate?: Date,
    lastLogin?: Date,
    serverIp?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.email !== undefined) {
      json += `"email": ${typeof this.email === 'number' || typeof this.email === 'boolean' ? this.email : JSON.stringify(this.email)},`;
    }
    if(this.website !== undefined) {
      json += `"website": ${typeof this.website === 'number' || typeof this.website === 'boolean' ? this.website : JSON.stringify(this.website)},`;
    }
    if(this.userId !== undefined) {
      json += `"userId": ${typeof this.userId === 'number' || typeof this.userId === 'boolean' ? this.userId : JSON.stringify(this.userId)},`;
    }
    if(this.birthDate !== undefined) {
      json += `"birthDate": ${typeof this.birthDate === 'number' || typeof this.birthDate === 'boolean' ? this.birthDate : JSON.stringify(this.birthDate)},`;
    }
    if(this.lastLogin !== undefined) {
      json += `"lastLogin": ${typeof this.lastLogin === 'number' || typeof this.lastLogin === 'boolean' ? this.lastLogin : JSON.stringify(this.lastLogin)},`;
    }
    if(this.serverIp !== undefined) {
      json += `"serverIp": ${typeof this.serverIp === 'number' || typeof this.serverIp === 'boolean' ? this.serverIp : JSON.stringify(this.serverIp)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["email","website","userId","birthDate","lastLogin","serverIp","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ObjectWithFormats {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ObjectWithFormats({} as any);

    if (obj["email"] !== undefined) {
      instance.email = obj["email"];
    }
    if (obj["website"] !== undefined) {
      instance.website = obj["website"];
    }
    if (obj["userId"] !== undefined) {
      instance.userId = obj["userId"];
    }
    if (obj["birthDate"] !== undefined) {
      instance.birthDate = obj["birthDate"];
    }
    if (obj["lastLogin"] !== undefined) {
      instance.lastLogin = obj["lastLogin"];
    }
    if (obj["serverIp"] !== undefined) {
      instance.serverIp = obj["serverIp"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["email","website","userId","birthDate","lastLogin","serverIp","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
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
export { ObjectWithFormats };