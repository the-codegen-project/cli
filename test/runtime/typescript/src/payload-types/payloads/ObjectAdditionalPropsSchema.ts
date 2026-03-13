import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Object with typed additional properties (integers)
 */
class ObjectAdditionalPropsSchema {
  private _known?: string;
  private _additionalProperties?: Record<string, number>;

  constructor(input: {
    known?: string,
    additionalProperties?: Record<string, number>,
  }) {
    this._known = input.known;
    this._additionalProperties = input.additionalProperties;
  }

  get known(): string | undefined { return this._known; }
  set known(known: string | undefined) { this._known = known; }

  get additionalProperties(): Record<string, number> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, number> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.known !== undefined) {
      json += `"known": ${typeof this.known === 'number' || typeof this.known === 'boolean' ? this.known : JSON.stringify(this.known)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["known","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ObjectAdditionalPropsSchema {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ObjectAdditionalPropsSchema({} as any);

    if (obj["known"] !== undefined) {
      instance.known = obj["known"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["known","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"known":{"type":"string"}},"additionalProperties":{"type":"integer"},"description":"Object with typed additional properties (integers)","$id":"ObjectAdditionalPropsSchema"};
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
export { ObjectAdditionalPropsSchema };