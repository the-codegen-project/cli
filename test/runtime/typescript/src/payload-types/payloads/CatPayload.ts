import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface CatPayloadInterface {
  breed?: string
  meowPitch?: string
  additionalProperties?: Record<string, any>
}
class CatPayload {
  private _petType: 'cat' = 'cat';
  private _breed?: string;
  private _meowPitch?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: CatPayloadInterface) {
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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.petType !== undefined) {
      json["petType"] = this.petType;
    }
    if(this.breed !== undefined) {
      json["breed"] = this.breed;
    }
    if(this.meowPitch !== undefined) {
      json["meowPitch"] = this.meowPitch;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["petType","breed","meowPitch","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): CatPayload {
    const instance = new CatPayload({} as any);

    if (obj["breed"] !== undefined) {
      instance.breed = obj["breed"] as string;
    }
    if (obj["meowPitch"] !== undefined) {
      instance.meowPitch = obj["meowPitch"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["petType","breed","meowPitch","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): CatPayload {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return CatPayload.fromJson(obj as Record<string, unknown>);
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
export { CatPayload, CatPayloadInterface };