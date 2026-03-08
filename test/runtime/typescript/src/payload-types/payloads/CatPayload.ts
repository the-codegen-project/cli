import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class CatPayload {
  private _petType: 'cat' = 'cat';
  private _breed?: string;
  private _meowPitch?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    breed?: string,
    meowPitch?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._breed = input.breed;
    this._meowPitch = input.meowPitch;
    this._additionalProperties = input.additionalProperties;
  }

  get petType(): 'cat' { return this._petType; }

  get breed(): string | undefined { return this._breed; }
  set breed(breed: string | undefined) { this._breed = breed; }

  get meowPitch(): string | undefined { return this._meowPitch; }
  set meowPitch(meowPitch: string | undefined) { this._meowPitch = meowPitch; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.petType !== undefined) {
      json += `"petType": ${typeof this.petType === 'number' || typeof this.petType === 'boolean' ? this.petType : JSON.stringify(this.petType)},`;
    }
    if(this.breed !== undefined) {
      json += `"breed": ${typeof this.breed === 'number' || typeof this.breed === 'boolean' ? this.breed : JSON.stringify(this.breed)},`;
    }
    if(this.meowPitch !== undefined) {
      json += `"meowPitch": ${typeof this.meowPitch === 'number' || typeof this.meowPitch === 'boolean' ? this.meowPitch : JSON.stringify(this.meowPitch)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["petType","breed","meowPitch","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): CatPayload {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new CatPayload({} as any);

    if (obj["breed"] !== undefined) {
      instance.breed = obj["breed"];
    }
    if (obj["meowPitch"] !== undefined) {
      instance.meowPitch = obj["meowPitch"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["petType","breed","meowPitch","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"petType":{"const":"cat"},"breed":{"type":"string"},"meowPitch":{"type":"string"}},"required":["petType"]};
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
export { CatPayload };