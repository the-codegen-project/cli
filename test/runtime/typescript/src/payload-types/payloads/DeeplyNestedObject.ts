import {DeeplyNestedObjectLevel1} from './DeeplyNestedObjectLevel1';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class DeeplyNestedObject {
  private _level1?: DeeplyNestedObjectLevel1;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    level1?: DeeplyNestedObjectLevel1,
    additionalProperties?: Record<string, any>,
  }) {
    this._level1 = input.level1;
    this._additionalProperties = input.additionalProperties;
  }

  get level1(): DeeplyNestedObjectLevel1 | undefined { return this._level1; }
  set level1(level1: DeeplyNestedObjectLevel1 | undefined) { this._level1 = level1; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.level1 !== undefined) {
      json += `"level1": ${this.level1 && typeof this.level1 === 'object' && 'marshal' in this.level1 && typeof this.level1.marshal === 'function' ? this.level1.marshal() : JSON.stringify(this.level1)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["level1","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): DeeplyNestedObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new DeeplyNestedObject({} as any);

    if (obj["level1"] !== undefined) {
      instance.level1 = DeeplyNestedObjectLevel1.unmarshal(obj["level1"]);
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["level1","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","properties":{"level1":{"type":"object","properties":{"level2":{"type":"object","properties":{"level3":{"type":"object","properties":{"value":{"type":"string"}}}}}}}},"description":"Object with 3 levels of nesting","$id":"DeeplyNestedObject"};
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
export { DeeplyNestedObject };