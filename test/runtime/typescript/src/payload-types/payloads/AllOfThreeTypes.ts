import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface AllOfThreeTypesInterface {
  id: string
  name?: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  updatedBy?: string
  additionalProperties?: Record<string, any>
}
/**
 * AllOf combining three schemas
 */
class AllOfThreeTypes {
  private _id: string;
  private _name?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _createdBy?: string;
  private _updatedBy?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: AllOfThreeTypesInterface) {
    this._id = input.id;
    this._name = input.name;
    this._createdAt = input.createdAt;
    this._updatedAt = input.updatedAt;
    this._createdBy = input.createdBy;
    this._updatedBy = input.updatedBy;
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

  get createdBy(): string | undefined { return this._createdBy; }
  set createdBy(createdBy: string | undefined) { this._createdBy = createdBy; }

  get updatedBy(): string | undefined { return this._updatedBy; }
  set updatedBy(updatedBy: string | undefined) { this._updatedBy = updatedBy; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.name !== undefined) {
      json["name"] = this.name;
    }
    if(this.createdAt !== undefined) {
      json["createdAt"] = this.createdAt;
    }
    if(this.updatedAt !== undefined) {
      json["updatedAt"] = this.updatedAt;
    }
    if(this.createdBy !== undefined) {
      json["createdBy"] = this.createdBy;
    }
    if(this.updatedBy !== undefined) {
      json["updatedBy"] = this.updatedBy;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","name","createdAt","updatedAt","createdBy","updatedBy","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): AllOfThreeTypes {
    const instance = new AllOfThreeTypes({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"] as string;
    }
    if (obj["createdAt"] !== undefined) {
      instance.createdAt = obj["createdAt"] == null ? undefined : new Date(obj["createdAt"] as string);
    }
    if (obj["updatedAt"] !== undefined) {
      instance.updatedAt = obj["updatedAt"] == null ? undefined : new Date(obj["updatedAt"] as string);
    }
    if (obj["createdBy"] !== undefined) {
      instance.createdBy = obj["createdBy"] as string;
    }
    if (obj["updatedBy"] !== undefined) {
      instance.updatedBy = obj["updatedBy"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","name","createdAt","updatedAt","createdBy","updatedBy","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): AllOfThreeTypes {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return AllOfThreeTypes.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","allOf":[{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"}},"required":["id"]},{"type":"object","properties":{"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"}}},{"type":"object","properties":{"createdBy":{"type":"string"},"updatedBy":{"type":"string"}}}],"description":"AllOf combining three schemas","$id":"AllOfThreeTypes"};
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
export { AllOfThreeTypes, AllOfThreeTypesInterface };