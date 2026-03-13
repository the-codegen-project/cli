import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
/**
 * Simple object with two properties
 */
class SimpleObject {
  private _name?: string;
  private _age?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    name?: string,
    age?: number,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.name !== undefined) {
      json += `"name": ${typeof this.name === 'number' || typeof this.name === 'boolean' ? this.name : JSON.stringify(this.name)},`;
    }
    if(this.age !== undefined) {
      json += `"age": ${typeof this.age === 'number' || typeof this.age === 'boolean' ? this.age : JSON.stringify(this.age)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["name","age","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): SimpleObject {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new SimpleObject({} as any);

    if (obj["name"] !== undefined) {
      instance.name = obj["name"];
    }
    if (obj["age"] !== undefined) {
      instance.age = obj["age"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["name","age","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
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
export { SimpleObject };