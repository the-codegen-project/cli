import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectWithOptionalInterface {
  field1?: string
  field2?: string
  field3?: string
  additionalProperties?: Record<string, any>
}
/**
 * Object with all optional properties
 */
class ObjectWithOptional {
  private _field1?: string;
  private _field2?: string;
  private _field3?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ObjectWithOptionalInterface) {
    this._field1 = input.field1;
    this._field2 = input.field2;
    this._field3 = input.field3;
    this._additionalProperties = input.additionalProperties;
  }

  get field1(): string | undefined { return this._field1; }
  set field1(field1: string | undefined) { this._field1 = field1; }

  get field2(): string | undefined { return this._field2; }
  set field2(field2: string | undefined) { this._field2 = field2; }

  get field3(): string | undefined { return this._field3; }
  set field3(field3: string | undefined) { this._field3 = field3; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.field1 !== undefined) {
      json["field1"] = this.field1;
    }
    if(this.field2 !== undefined) {
      json["field2"] = this.field2;
    }
    if(this.field3 !== undefined) {
      json["field3"] = this.field3;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["field1","field2","field3","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectWithOptional {
    const instance = new ObjectWithOptional({} as any);

    if (obj["field1"] !== undefined) {
      instance.field1 = obj["field1"] as string;
    }
    if (obj["field2"] !== undefined) {
      instance.field2 = obj["field2"] as string;
    }
    if (obj["field3"] !== undefined) {
      instance.field3 = obj["field3"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["field1","field2","field3","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ObjectWithOptional {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectWithOptional.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"field1":{"type":"string"},"field2":{"type":"string"},"field3":{"type":"string"}},"description":"Object with all optional properties","$id":"ObjectWithOptional"};
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
export { ObjectWithOptional, ObjectWithOptionalInterface };