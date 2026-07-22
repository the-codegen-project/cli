import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface DogPayloadInterface {
  breed?: string
  barkVolume?: number
  additionalProperties?: Record<string, any>
}
class DogPayload {
  private _petType: 'dog' = 'dog';
  private _breed?: string;
  private _barkVolume?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: DogPayloadInterface) {
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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.petType !== undefined) {
      json["petType"] = this.petType;
    }
    if(this.breed !== undefined) {
      json["breed"] = this.breed;
    }
    if(this.barkVolume !== undefined) {
      json["barkVolume"] = this.barkVolume;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["petType","breed","barkVolume","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): DogPayload {
    const instance = new DogPayload({} as any);

    if (obj["breed"] !== undefined) {
      instance.breed = obj["breed"] as string;
    }
    if (obj["barkVolume"] !== undefined) {
      instance.barkVolume = obj["barkVolume"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["petType","breed","barkVolume","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): DogPayload {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return DogPayload.fromJson(obj as Record<string, unknown>);
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
export { DogPayload, DogPayloadInterface };