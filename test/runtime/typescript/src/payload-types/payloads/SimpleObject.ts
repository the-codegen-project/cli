import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface SimpleObjectInterface {
  name?: string
  age?: number
  additionalProperties?: Record<string, any>
}
/**
 * Simple object with two properties
 */
class SimpleObject {
  private _name?: string;
  private _age?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: SimpleObjectInterface) {
    this._name = input.name;
    this._age = input.age;
    this._additionalProperties = input.additionalProperties;
  }

  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

  get age(): number | undefined { return this._age; }
  set age(age: number | undefined) { this._age = age; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.name !== undefined) {
      json["name"] = this.name;
    }
    if(this.age !== undefined) {
      json["age"] = this.age;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["name","age","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): SimpleObject {
    const instance = new SimpleObject({} as any);

    if (obj["name"] !== undefined) {
      instance.name = obj["name"] as string;
    }
    if (obj["age"] !== undefined) {
      instance.age = obj["age"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["name","age","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): SimpleObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return SimpleObject.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"name":{"type":"string"},"age":{"type":"integer"}},"description":"Simple object with two properties","$id":"SimpleObject"};
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
export { SimpleObject, SimpleObjectInterface };