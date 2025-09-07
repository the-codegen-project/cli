import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
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

  constructor(input: {
    id?: number,
    username?: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    password?: string,
    phone?: string,
    userStatus?: number,
    additionalProperties?: Record<string, any>,
  }) {
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

  get userStatus(): number | undefined { return this._userStatus; }
  set userStatus(userStatus: number | undefined) { this._userStatus = userStatus; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.username !== undefined) {
      json += `"username": ${typeof this.username === 'number' || typeof this.username === 'boolean' ? this.username : JSON.stringify(this.username)},`;
    }
    if(this.firstName !== undefined) {
      json += `"firstName": ${typeof this.firstName === 'number' || typeof this.firstName === 'boolean' ? this.firstName : JSON.stringify(this.firstName)},`;
    }
    if(this.lastName !== undefined) {
      json += `"lastName": ${typeof this.lastName === 'number' || typeof this.lastName === 'boolean' ? this.lastName : JSON.stringify(this.lastName)},`;
    }
    if(this.email !== undefined) {
      json += `"email": ${typeof this.email === 'number' || typeof this.email === 'boolean' ? this.email : JSON.stringify(this.email)},`;
    }
    if(this.password !== undefined) {
      json += `"password": ${typeof this.password === 'number' || typeof this.password === 'boolean' ? this.password : JSON.stringify(this.password)},`;
    }
    if(this.phone !== undefined) {
      json += `"phone": ${typeof this.phone === 'number' || typeof this.phone === 'boolean' ? this.phone : JSON.stringify(this.phone)},`;
    }
    if(this.userStatus !== undefined) {
      json += `"userStatus": ${typeof this.userStatus === 'number' || typeof this.userStatus === 'boolean' ? this.userStatus : JSON.stringify(this.userStatus)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","username","firstName","lastName","email","password","phone","userStatus","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): AUser {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new AUser({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["username"] !== undefined) {
      instance.username = obj["username"];
    }
    if (obj["firstName"] !== undefined) {
      instance.firstName = obj["firstName"];
    }
    if (obj["lastName"] !== undefined) {
      instance.lastName = obj["lastName"];
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"];
    }
    if (obj["password"] !== undefined) {
      instance.password = obj["password"];
    }
    if (obj["phone"] !== undefined) {
      instance.phone = obj["phone"];
    }
    if (obj["userStatus"] !== undefined) {
      instance.userStatus = obj["userStatus"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","username","firstName","lastName","email","password","phone","userStatus","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"title":"a User","description":"A User who is purchasing from the pet store","type":"object","properties":{"id":{"type":"integer","format":"int64"},"username":{"type":"string"},"firstName":{"type":"string"},"lastName":{"type":"string"},"email":{"type":"string"},"password":{"type":"string"},"phone":{"type":"string"},"userStatus":{"type":"integer","format":"int32","description":"User Status"}},"xml":{"name":"User"},"$id":"User","$schema":"http://json-schema.org/draft-07/schema"};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { AUser };