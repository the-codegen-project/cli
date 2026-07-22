import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface OneOfThreeTypesOneOfOption2Interface {
  value?: string
  additionalProperties?: Record<string, any>
}
class OneOfThreeTypesOneOfOption2 {
  private _value?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OneOfThreeTypesOneOfOption2Interface) {
    this._value = input.value;
    this._additionalProperties = input.additionalProperties;
  }

  get value(): string | undefined { return this._value; }
  set value(value: string | undefined) { this._value = value; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.value !== undefined) {
      json["value"] = this.value;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["value","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OneOfThreeTypesOneOfOption2 {
    const instance = new OneOfThreeTypesOneOfOption2({} as any);

    if (obj["value"] !== undefined) {
      instance.value = obj["value"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["value","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OneOfThreeTypesOneOfOption2 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OneOfThreeTypesOneOfOption2.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"value":{"type":"string"}}};
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
export { OneOfThreeTypesOneOfOption2, OneOfThreeTypesOneOfOption2Interface };