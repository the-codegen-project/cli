import {DeeplyNestedObjectLevel1} from './DeeplyNestedObjectLevel1';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface DeeplyNestedObjectInterface {
  level1?: DeeplyNestedObjectLevel1
  additionalProperties?: Record<string, any>
}
/**
 * Object with 3 levels of nesting
 */
class DeeplyNestedObject {
  private _level1?: DeeplyNestedObjectLevel1;
  private _additionalProperties?: Record<string, any>;

  constructor(input: DeeplyNestedObjectInterface) {
    this._level1 = input.level1;
    this._additionalProperties = input.additionalProperties;
  }

  get level1(): DeeplyNestedObjectLevel1 | undefined { return this._level1; }
  set level1(level1: DeeplyNestedObjectLevel1 | undefined) { this._level1 = level1; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.level1 !== undefined) {
      json["level1"] = this.level1 && typeof this.level1 === 'object' && 'toJson' in this.level1 && typeof this.level1.toJson === 'function' ? this.level1.toJson() : this.level1;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["level1","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): DeeplyNestedObject {
    const instance = new DeeplyNestedObject({} as any);

    if (obj["level1"] !== undefined) {
      instance.level1 = DeeplyNestedObjectLevel1.fromJson(obj["level1"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["level1","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): DeeplyNestedObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return DeeplyNestedObject.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"level1":{"type":"object","properties":{"level2":{"type":"object","properties":{"level3":{"type":"object","properties":{"value":{"type":"string"}}}}}}}},"description":"Object with 3 levels of nesting","$id":"DeeplyNestedObject"};
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
export { DeeplyNestedObject, DeeplyNestedObjectInterface };