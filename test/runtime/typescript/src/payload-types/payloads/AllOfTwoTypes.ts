import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class AllOfTwoTypes {
  private _id: string;
  private _name?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id: string,
    name?: string,
    createdAt?: Date,
    updatedAt?: Date,
    additionalProperties?: Record<string, any>,
  }) {
    this._id = input.id;
    this._name = input.name;
    this._createdAt = input.createdAt;
    this._updatedAt = input.updatedAt;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

  get createdAt(): Date | undefined { return this._createdAt; }
  set createdAt(createdAt: Date | undefined) { this._createdAt = createdAt; }

  get updatedAt(): Date | undefined { return this._updatedAt; }
  set updatedAt(updatedAt: Date | undefined) { this._updatedAt = updatedAt; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.name !== undefined) {
      json += `"name": ${typeof this.name === 'number' || typeof this.name === 'boolean' ? this.name : JSON.stringify(this.name)},`;
    }
    if(this.createdAt !== undefined) {
      json += `"createdAt": ${typeof this.createdAt === 'number' || typeof this.createdAt === 'boolean' ? this.createdAt : JSON.stringify(this.createdAt)},`;
    }
    if(this.updatedAt !== undefined) {
      json += `"updatedAt": ${typeof this.updatedAt === 'number' || typeof this.updatedAt === 'boolean' ? this.updatedAt : JSON.stringify(this.updatedAt)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","name","createdAt","updatedAt","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): AllOfTwoTypes {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new AllOfTwoTypes({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"];
    }
    if (obj["createdAt"] !== undefined) {
      instance.createdAt = obj["createdAt"];
    }
    if (obj["updatedAt"] !== undefined) {
      instance.updatedAt = obj["updatedAt"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","name","createdAt","updatedAt","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","allOf":[{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id"]},{"type":"object","properties":{"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}}],"description":"AllOf combining base entity and timestamp","$id":"AllOfTwoTypes"};
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
export { AllOfTwoTypes };