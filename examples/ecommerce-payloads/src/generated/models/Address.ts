import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class Address {
  private _street: string;
  private _city: string;
  private _state?: string;
  private _country: string;
  private _postalCode: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    street: string,
    city: string,
    state?: string,
    country: string,
    postalCode: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._street = input.street;
    this._city = input.city;
    this._state = input.state;
    this._country = input.country;
    this._postalCode = input.postalCode;
    this._additionalProperties = input.additionalProperties;
  }

  get street(): string { return this._street; }
  set street(street: string) { this._street = street; }

  get city(): string { return this._city; }
  set city(city: string) { this._city = city; }

  get state(): string | undefined { return this._state; }
  set state(state: string | undefined) { this._state = state; }

  get country(): string { return this._country; }
  set country(country: string) { this._country = country; }

  get postalCode(): string { return this._postalCode; }
  set postalCode(postalCode: string) { this._postalCode = postalCode; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.street !== undefined) {
      json += `"street": ${typeof this.street === 'number' || typeof this.street === 'boolean' ? this.street : JSON.stringify(this.street)},`;
    }
    if(this.city !== undefined) {
      json += `"city": ${typeof this.city === 'number' || typeof this.city === 'boolean' ? this.city : JSON.stringify(this.city)},`;
    }
    if(this.state !== undefined) {
      json += `"state": ${typeof this.state === 'number' || typeof this.state === 'boolean' ? this.state : JSON.stringify(this.state)},`;
    }
    if(this.country !== undefined) {
      json += `"country": ${typeof this.country === 'number' || typeof this.country === 'boolean' ? this.country : JSON.stringify(this.country)},`;
    }
    if(this.postalCode !== undefined) {
      json += `"postalCode": ${typeof this.postalCode === 'number' || typeof this.postalCode === 'boolean' ? this.postalCode : JSON.stringify(this.postalCode)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["street","city","state","country","postalCode","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): Address {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new Address({} as any);

    if (obj["street"] !== undefined) {
      instance.street = obj["street"];
    }
    if (obj["city"] !== undefined) {
      instance.city = obj["city"];
    }
    if (obj["state"] !== undefined) {
      instance.state = obj["state"];
    }
    if (obj["country"] !== undefined) {
      instance.country = obj["country"];
    }
    if (obj["postalCode"] !== undefined) {
      instance.postalCode = obj["postalCode"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["street","city","state","country","postalCode","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string","minLength":2,"maxLength":2,"description":"ISO 3166-1 alpha-2 country code"},"postalCode":{"type":"string"}}};
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
export { Address };