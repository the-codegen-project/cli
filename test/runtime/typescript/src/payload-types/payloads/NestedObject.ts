import {NestedObjectOuter} from './NestedObjectOuter';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface NestedObjectInterface {
  outer?: NestedObjectOuter
  additionalProperties?: Record<string, any>
}
/**
 * Object with one level of nesting
 */
class NestedObject {
  private _outer?: NestedObjectOuter;
  private _additionalProperties?: Record<string, any>;

  constructor(input: NestedObjectInterface) {
    this._outer = input.outer;
    this._additionalProperties = input.additionalProperties;
  }

  get outer(): NestedObjectOuter | undefined { return this._outer; }
  set outer(outer: NestedObjectOuter | undefined) { this._outer = outer; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.outer !== undefined) {
      json["outer"] = this.outer && typeof this.outer === 'object' && 'toJson' in this.outer && typeof this.outer.toJson === 'function' ? this.outer.toJson() : this.outer;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["outer","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): NestedObject {
    const instance = new NestedObject({} as any);

    if (obj["outer"] !== undefined) {
      instance.outer = NestedObjectOuter.fromJson(obj["outer"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["outer","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): NestedObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return NestedObject.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"outer":{"type":"object","properties":{"inner":{"type":"string"}}}},"description":"Object with one level of nesting","$id":"NestedObject"};
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
export { NestedObject, NestedObjectInterface };