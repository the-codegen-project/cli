import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Object that disallows additional properties
 */
class ObjectAdditionalPropsFalse {
  private _known?: string;

  constructor(input: {
    known?: string,
  }) {
    this._known = input.known;
  }

  get known(): string | undefined { return this._known; }
  set known(known: string | undefined) { this._known = known; }

  public marshal() : string {
    let json = '{'
    if(this.known !== undefined) {
      json += `"known": ${typeof this.known === 'number' || typeof this.known === 'boolean' ? this.known : JSON.stringify(this.known)},`;
    }
  
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ObjectAdditionalPropsFalse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ObjectAdditionalPropsFalse({} as any);

    if (obj["known"] !== undefined) {
      instance.known = obj["known"];
    }
  
  
    return instance;
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
export { ObjectAdditionalPropsFalse };