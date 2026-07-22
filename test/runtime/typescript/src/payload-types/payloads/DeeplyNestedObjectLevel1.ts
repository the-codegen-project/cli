import {DeeplyNestedObjectLevel1Level2} from './DeeplyNestedObjectLevel1Level2';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface DeeplyNestedObjectLevel1Interface {
  level2?: DeeplyNestedObjectLevel1Level2
  additionalProperties?: Record<string, any>
}
class DeeplyNestedObjectLevel1 {
  private _level2?: DeeplyNestedObjectLevel1Level2;
  private _additionalProperties?: Record<string, any>;

  constructor(input: DeeplyNestedObjectLevel1Interface) {
    this._level2 = input.level2;
    this._additionalProperties = input.additionalProperties;
  }

  get level2(): DeeplyNestedObjectLevel1Level2 | undefined { return this._level2; }
  set level2(level2: DeeplyNestedObjectLevel1Level2 | undefined) { this._level2 = level2; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.level2 !== undefined) {
      json["level2"] = this.level2 && typeof this.level2 === 'object' && 'toJson' in this.level2 && typeof this.level2.toJson === 'function' ? this.level2.toJson() : this.level2;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["level2","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): DeeplyNestedObjectLevel1 {
    const instance = new DeeplyNestedObjectLevel1({} as any);

    if (obj["level2"] !== undefined) {
      instance.level2 = DeeplyNestedObjectLevel1Level2.fromJson(obj["level2"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["level2","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): DeeplyNestedObjectLevel1 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return DeeplyNestedObjectLevel1.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"level2":{"type":"object","properties":{"level3":{"type":"object","properties":{"value":{"type":"string"}}}}}}};
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
export { DeeplyNestedObjectLevel1, DeeplyNestedObjectLevel1Interface };