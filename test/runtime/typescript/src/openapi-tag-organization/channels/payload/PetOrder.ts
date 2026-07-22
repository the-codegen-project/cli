import {Status} from './Status';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface PetOrderInterface {
  id?: number
  petId?: number
  quantity?: number
  shipDate?: Date
  status?: Status
  complete?: boolean
  additionalProperties?: Record<string, any>
}
/**
 * An order for a pets from the pet store
 */
class PetOrder {
  private _id?: number;
  private _petId?: number;
  private _quantity?: number;
  private _shipDate?: Date;
  private _status?: Status;
  private _complete?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: PetOrderInterface) {
    this._id = input.id;
    this._petId = input.petId;
    this._quantity = input.quantity;
    this._shipDate = input.shipDate;
    this._status = input.status;
    this._complete = input.complete;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): number | undefined { return this._id; }
  set id(id: number | undefined) { this._id = id; }

  get petId(): number | undefined { return this._petId; }
  set petId(petId: number | undefined) { this._petId = petId; }

  get quantity(): number | undefined { return this._quantity; }
  set quantity(quantity: number | undefined) { this._quantity = quantity; }

  get shipDate(): Date | undefined { return this._shipDate; }
  set shipDate(shipDate: Date | undefined) { this._shipDate = shipDate; }

  /**
   * Order Status
   */
  get status(): Status | undefined { return this._status; }
  set status(status: Status | undefined) { this._status = status; }

  get complete(): boolean | undefined { return this._complete; }
  set complete(complete: boolean | undefined) { this._complete = complete; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.petId !== undefined) {
      json["petId"] = this.petId;
    }
    if(this.quantity !== undefined) {
      json["quantity"] = this.quantity;
    }
    if(this.shipDate !== undefined) {
      json["shipDate"] = this.shipDate;
    }
    if(this.status !== undefined) {
      json["status"] = this.status;
    }
    if(this.complete !== undefined) {
      json["complete"] = this.complete;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","petId","quantity","shipDate","status","complete","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): PetOrder {
    const instance = new PetOrder({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as number;
    }
    if (obj["petId"] !== undefined) {
      instance.petId = obj["petId"] as number;
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"] as number;
    }
    if (obj["shipDate"] !== undefined) {
      instance.shipDate = obj["shipDate"] == null ? undefined : new Date(obj["shipDate"] as string);
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"] as Status;
    }
    if (obj["complete"] !== undefined) {
      instance.complete = obj["complete"] as boolean;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","petId","quantity","shipDate","status","complete","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): PetOrder {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return PetOrder.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"title":"Pet Order","description":"An order for a pets from the pet store","type":"object","properties":{"id":{"type":"integer","format":"int64"},"petId":{"type":"integer","format":"int64"},"quantity":{"type":"integer","format":"int32"},"shipDate":{"type":"string","format":"date-time"},"status":{"type":"string","description":"Order Status","enum":["placed","approved","delivered"]},"complete":{"type":"boolean","default":false}},"xml":{"name":"Order"},"$id":"Order","$schema":"http://json-schema.org/draft-07/schema"};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { PetOrder, PetOrderInterface };