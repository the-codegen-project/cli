import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Object with default values
 */
class ObjectWithDefaults {
  private _status?: string;
  private _count?: number;
  private _enabled?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    status?: string,
    count?: number,
    enabled?: boolean,
    additionalProperties?: Record<string, any>,
  }) {
    this._status = input.status;
    this._count = input.count;
    this._enabled = input.enabled;
    this._additionalProperties = input.additionalProperties;
  }

  get status(): string | undefined { return this._status; }
  set status(status: string | undefined) { this._status = status; }

  get count(): number | undefined { return this._count; }
  set count(count: number | undefined) { this._count = count; }

  get enabled(): boolean | undefined { return this._enabled; }
  set enabled(enabled: boolean | undefined) { this._enabled = enabled; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.status !== undefined) {
      json += `"status": ${typeof this.status === 'number' || typeof this.status === 'boolean' ? this.status : JSON.stringify(this.status)},`;
    }
    if(this.count !== undefined) {
      json += `"count": ${typeof this.count === 'number' || typeof this.count === 'boolean' ? this.count : JSON.stringify(this.count)},`;
    }
    if(this.enabled !== undefined) {
      json += `"enabled": ${typeof this.enabled === 'number' || typeof this.enabled === 'boolean' ? this.enabled : JSON.stringify(this.enabled)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["status","count","enabled","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ObjectWithDefaults {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ObjectWithDefaults({} as any);

    if (obj["status"] !== undefined) {
      instance.status = obj["status"];
    }
    if (obj["count"] !== undefined) {
      instance.count = obj["count"];
    }
    if (obj["enabled"] !== undefined) {
      instance.enabled = obj["enabled"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["status","count","enabled","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"status":{"type":"string","default":"pending"},"count":{"type":"integer","default":0},"enabled":{"type":"boolean","default":true}},"description":"Object with default values","$id":"ObjectWithDefaults"};
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
export { ObjectWithDefaults };