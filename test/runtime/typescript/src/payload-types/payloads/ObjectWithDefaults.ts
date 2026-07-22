import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectWithDefaultsInterface {
  status?: string
  count?: number
  enabled?: boolean
  additionalProperties?: Record<string, any>
}
/**
 * Object with default values
 */
class ObjectWithDefaults {
  private _status?: string;
  private _count?: number;
  private _enabled?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ObjectWithDefaultsInterface) {
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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.status !== undefined) {
      json["status"] = this.status;
    }
    if(this.count !== undefined) {
      json["count"] = this.count;
    }
    if(this.enabled !== undefined) {
      json["enabled"] = this.enabled;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["status","count","enabled","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectWithDefaults {
    const instance = new ObjectWithDefaults({} as any);

    if (obj["status"] !== undefined) {
      instance.status = obj["status"] as string;
    }
    if (obj["count"] !== undefined) {
      instance.count = obj["count"] as number;
    }
    if (obj["enabled"] !== undefined) {
      instance.enabled = obj["enabled"] as boolean;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["status","count","enabled","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ObjectWithDefaults {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectWithDefaults.fromJson(obj as Record<string, unknown>);
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
export { ObjectWithDefaults, ObjectWithDefaultsInterface };