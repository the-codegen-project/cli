import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class PetTag {
  private _id?: number;
  private _name?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id?: number,
    name?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._id = input.id;
    this._name = input.name;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): number | undefined { return this._id; }
  set id(id: number | undefined) { this._id = id; }

  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

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
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","name","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PetTag {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PetTag({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","name","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"title":"Pet Tag","description":"A tag for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"}},"xml":{"name":"Tag"}};
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    const {data, ajvValidatorFunction} = context ?? {};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { PetTag };