import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class DogPayload {
  private _petType: 'dog' = 'dog';
  private _breed?: string;
  private _barkVolume?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    breed?: string,
    barkVolume?: number,
    additionalProperties?: Record<string, any>,
  }) {
    this._breed = input.breed;
    this._barkVolume = input.barkVolume;
    this._additionalProperties = input.additionalProperties;
  }

  get petType(): 'dog' { return this._petType; }

  get breed(): string | undefined { return this._breed; }
  set breed(breed: string | undefined) { this._breed = breed; }

  get barkVolume(): number | undefined { return this._barkVolume; }
  set barkVolume(barkVolume: number | undefined) { this._barkVolume = barkVolume; }

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
    if(this.barkVolume !== undefined) {
      json += `"barkVolume": ${typeof this.barkVolume === 'number' || typeof this.barkVolume === 'boolean' ? this.barkVolume : JSON.stringify(this.barkVolume)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["petType","breed","barkVolume","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): DogPayload {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new DogPayload({} as any);

    if (obj["breed"] !== undefined) {
      instance.breed = obj["breed"];
    }
    if (obj["barkVolume"] !== undefined) {
      instance.barkVolume = obj["barkVolume"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["petType","breed","barkVolume","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"petType":{"const":"dog"},"breed":{"type":"string"},"barkVolume":{"type":"integer"}},"required":["petType"]};
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
export { DogPayload };