import {NestedObjectOuter} from './NestedObjectOuter';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class NestedObject {
  private _outer?: NestedObjectOuter;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    outer?: NestedObjectOuter,
    additionalProperties?: Record<string, any>,
  }) {
    this._outer = input.outer;
    this._additionalProperties = input.additionalProperties;
  }

  get outer(): NestedObjectOuter | undefined { return this._outer; }
  set outer(outer: NestedObjectOuter | undefined) { this._outer = outer; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.outer !== undefined) {
      json += `"outer": ${this.outer && typeof this.outer === 'object' && 'marshal' in this.outer && typeof this.outer.marshal === 'function' ? this.outer.marshal() : JSON.stringify(this.outer)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["outer","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): NestedObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new NestedObject({} as any);

    if (obj["outer"] !== undefined) {
      instance.outer = NestedObjectOuter.unmarshal(obj["outer"]);
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["outer","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"outer":{"type":"object","properties":{"inner":{"type":"string"}}}},"description":"Object with one level of nesting","$id":"NestedObject"};
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
export { NestedObject };