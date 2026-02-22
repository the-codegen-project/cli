import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class ObjectWithOptional {
  private _field1?: string;
  private _field2?: string;
  private _field3?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    field1?: string,
    field2?: string,
    field3?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.field1 !== undefined) {
      json += `"field1": ${typeof this.field1 === 'number' || typeof this.field1 === 'boolean' ? this.field1 : JSON.stringify(this.field1)},`;
    }
    if(this.field2 !== undefined) {
      json += `"field2": ${typeof this.field2 === 'number' || typeof this.field2 === 'boolean' ? this.field2 : JSON.stringify(this.field2)},`;
    }
    if(this.field3 !== undefined) {
      json += `"field3": ${typeof this.field3 === 'number' || typeof this.field3 === 'boolean' ? this.field3 : JSON.stringify(this.field3)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["field1","field2","field3","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ObjectWithOptional {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ObjectWithOptional({} as any);

    if (obj["field1"] !== undefined) {
      instance.field1 = obj["field1"];
    }
    if (obj["field2"] !== undefined) {
      instance.field2 = obj["field2"];
    }
    if (obj["field3"] !== undefined) {
      instance.field3 = obj["field3"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["field1","field2","field3","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
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
export { ObjectWithOptional };