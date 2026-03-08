import {DeeplyNestedObjectLevel1Level2Level3} from './DeeplyNestedObjectLevel1Level2Level3';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class DeeplyNestedObjectLevel1Level2 {
  private _level3?: DeeplyNestedObjectLevel1Level2Level3;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    level3?: DeeplyNestedObjectLevel1Level2Level3,
    additionalProperties?: Record<string, any>,
  }) {
    this._level3 = input.level3;
    this._additionalProperties = input.additionalProperties;
  }

  get level3(): DeeplyNestedObjectLevel1Level2Level3 | undefined { return this._level3; }
  set level3(level3: DeeplyNestedObjectLevel1Level2Level3 | undefined) { this._level3 = level3; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.level3 !== undefined) {
      json += `"level3": ${this.level3 && typeof this.level3 === 'object' && 'marshal' in this.level3 && typeof this.level3.marshal === 'function' ? this.level3.marshal() : JSON.stringify(this.level3)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["level3","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): DeeplyNestedObjectLevel1Level2 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new DeeplyNestedObjectLevel1Level2({} as any);

    if (obj["level3"] !== undefined) {
      instance.level3 = DeeplyNestedObjectLevel1Level2Level3.unmarshal(obj["level3"]);
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["level3","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"level3":{"type":"object","properties":{"value":{"type":"string"}}}}};
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
export { DeeplyNestedObjectLevel1Level2 };