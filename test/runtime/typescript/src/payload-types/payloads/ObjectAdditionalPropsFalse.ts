import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ObjectAdditionalPropsFalseInterface {
  known?: string
}
/**
 * Object that disallows additional properties
 */
class ObjectAdditionalPropsFalse {
  private _known?: string;

  constructor(input: ObjectAdditionalPropsFalseInterface) {
    this._known = input.known;
  }

  get known(): string | undefined { return this._known; }
  set known(known: string | undefined) { this._known = known; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.known !== undefined) {
      json["known"] = this.known;
    }
  
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ObjectAdditionalPropsFalse {
    const instance = new ObjectAdditionalPropsFalse({} as any);

    if (obj["known"] !== undefined) {
      instance.known = obj["known"] as string;
    }

  
    return instance;
  }

  public static unmarshal(json: string | object): ObjectAdditionalPropsFalse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ObjectAdditionalPropsFalse.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"known":{"type":"string"}},"additionalProperties":false,"description":"Object that disallows additional properties","$id":"ObjectAdditionalPropsFalse"};
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
export { ObjectAdditionalPropsFalse, ObjectAdditionalPropsFalseInterface };