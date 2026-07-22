import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectWithRequiredInterface {
  id: string
  name: string
  optionalField?: string
  additionalProperties?: Record<string, any>
}
/**
 * Object with required and optional properties
 */
class ObjectWithRequired {
  private _id: string;
  private _name: string;
  private _optionalField?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ObjectWithRequiredInterface) {
    this._id = input.id;
    this._name = input.name;
    this._optionalField = input.optionalField;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  get name(): string { return this._name; }
  set name(name: string) { this._name = name; }

  get optionalField(): string | undefined { return this._optionalField; }
  set optionalField(optionalField: string | undefined) { this._optionalField = optionalField; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.name !== undefined) {
      json["name"] = this.name;
    }
    if(this.optionalField !== undefined) {
      json["optional_field"] = this.optionalField;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","name","optional_field","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectWithRequired {
    const instance = new ObjectWithRequired({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"] as string;
    }
    if (obj["optional_field"] !== undefined) {
      instance.optionalField = obj["optional_field"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","name","optional_field","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ObjectWithRequired {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectWithRequired.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"id":{"type":"string"},"name":{"type":"string"},"optional_field":{"type":"string"}},"required":["id","name"],"description":"Object with required and optional properties","$id":"ObjectWithRequired"};
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
export { ObjectWithRequired, ObjectWithRequiredInterface };