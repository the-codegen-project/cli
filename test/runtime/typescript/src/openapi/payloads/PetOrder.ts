import {Status} from './Status';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class PetOrder {
  private _id?: number;
  private _petId?: number;
  private _quantity?: number;
  private _shipDate?: string;
  private _status?: Status;
  private _complete?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id?: number,
    petId?: number,
    quantity?: number,
    shipDate?: string,
    status?: Status,
    complete?: boolean,
    additionalProperties?: Record<string, any>,
  }) {
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

  get shipDate(): string | undefined { return this._shipDate; }
  set shipDate(shipDate: string | undefined) { this._shipDate = shipDate; }

  get status(): Status | undefined { return this._status; }
  set status(status: Status | undefined) { this._status = status; }

  get complete(): boolean | undefined { return this._complete; }
  set complete(complete: boolean | undefined) { this._complete = complete; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.petId !== undefined) {
      json += `"petId": ${typeof this.petId === 'number' || typeof this.petId === 'boolean' ? this.petId : JSON.stringify(this.petId)},`;
    }
    if(this.quantity !== undefined) {
      json += `"quantity": ${typeof this.quantity === 'number' || typeof this.quantity === 'boolean' ? this.quantity : JSON.stringify(this.quantity)},`;
    }
    if(this.shipDate !== undefined) {
      json += `"shipDate": ${typeof this.shipDate === 'number' || typeof this.shipDate === 'boolean' ? this.shipDate : JSON.stringify(this.shipDate)},`;
    }
    if(this.status !== undefined) {
      json += `"status": ${typeof this.status === 'number' || typeof this.status === 'boolean' ? this.status : JSON.stringify(this.status)},`;
    }
    if(this.complete !== undefined) {
      json += `"complete": ${typeof this.complete === 'number' || typeof this.complete === 'boolean' ? this.complete : JSON.stringify(this.complete)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","petId","quantity","shipDate","status","complete","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PetOrder {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PetOrder({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["petId"] !== undefined) {
      instance.petId = obj["petId"];
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"];
    }
    if (obj["shipDate"] !== undefined) {
      instance.shipDate = obj["shipDate"];
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"];
    }
    if (obj["complete"] !== undefined) {
      instance.complete = obj["complete"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","petId","quantity","shipDate","status","complete","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"title":"Pet Order","description":"An order for a pets from the pet store","type":"object","properties":{"id":{"type":"integer","format":"int64"},"petId":{"type":"integer","format":"int64"},"quantity":{"type":"integer","format":"int32"},"shipDate":{"type":"string","format":"date-time"},"status":{"type":"string","description":"Order Status","enum":["placed","approved","delivered"]},"complete":{"type":"boolean","default":false}},"xml":{"name":"Order"},"$id":"Order","$schema":"http://json-schema.org/draft-07/schema"};
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
export { PetOrder };