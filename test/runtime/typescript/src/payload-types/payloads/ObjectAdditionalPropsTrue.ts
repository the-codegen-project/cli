import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectAdditionalPropsTrueInterface {
  known?: string
  additionalProperties?: Record<string, any>
}
/**
 * Object that allows additional properties
 */
class ObjectAdditionalPropsTrue {
  private _known?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ObjectAdditionalPropsTrueInterface) {
    this._known = input.known;
    this._additionalProperties = input.additionalProperties;
  }

  get known(): string | undefined { return this._known; }
  set known(known: string | undefined) { this._known = known; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.known !== undefined) {
      json["known"] = this.known;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["known","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectAdditionalPropsTrue {
    const instance = new ObjectAdditionalPropsTrue({} as any);

    if (obj["known"] !== undefined) {
      instance.known = obj["known"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["known","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ObjectAdditionalPropsTrue {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectAdditionalPropsTrue.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"known":{"type":"string"}},"additionalProperties":true,"description":"Object that allows additional properties","$id":"ObjectAdditionalPropsTrue"};
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
export { ObjectAdditionalPropsTrue, ObjectAdditionalPropsTrueInterface };