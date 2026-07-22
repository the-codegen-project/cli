import {DeeplyNestedObjectLevel1Level2Level3} from './DeeplyNestedObjectLevel1Level2Level3';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface DeeplyNestedObjectLevel1Level2Interface {
  level3?: DeeplyNestedObjectLevel1Level2Level3
  additionalProperties?: Record<string, any>
}
class DeeplyNestedObjectLevel1Level2 {
  private _level3?: DeeplyNestedObjectLevel1Level2Level3;
  private _additionalProperties?: Record<string, any>;

  constructor(input: DeeplyNestedObjectLevel1Level2Interface) {
    this._level3 = input.level3;
    this._additionalProperties = input.additionalProperties;
  }

  get level3(): DeeplyNestedObjectLevel1Level2Level3 | undefined { return this._level3; }
  set level3(level3: DeeplyNestedObjectLevel1Level2Level3 | undefined) { this._level3 = level3; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.level3 !== undefined) {
      json["level3"] = this.level3 && typeof this.level3 === 'object' && 'toJson' in this.level3 && typeof this.level3.toJson === 'function' ? this.level3.toJson() : this.level3;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["level3","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): DeeplyNestedObjectLevel1Level2 {
    const instance = new DeeplyNestedObjectLevel1Level2({} as any);

    if (obj["level3"] !== undefined) {
      instance.level3 = DeeplyNestedObjectLevel1Level2Level3.fromJson(obj["level3"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["level3","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): DeeplyNestedObjectLevel1Level2 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return DeeplyNestedObjectLevel1Level2.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"level3":{"type":"object","properties":{"value":{"type":"string"}}}}};
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
export { DeeplyNestedObjectLevel1Level2, DeeplyNestedObjectLevel1Level2Interface };