import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class ItemResponse {
  private _id?: string;
  private _userId?: string;
  private _name?: string;
  private _description?: string;
  private _quantity?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id?: string,
    userId?: string,
    name?: string,
    description?: string,
    quantity?: number,
    additionalProperties?: Record<string, any>,
  }) {
    this._id = input.id;
    this._userId = input.userId;
    this._name = input.name;
    this._description = input.description;
    this._quantity = input.quantity;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  get userId(): string | undefined { return this._userId; }
  set userId(userId: string | undefined) { this._userId = userId; }

  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

  get description(): string | undefined { return this._description; }
  set description(description: string | undefined) { this._description = description; }

  get quantity(): number | undefined { return this._quantity; }
  set quantity(quantity: number | undefined) { this._quantity = quantity; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.userId !== undefined) {
      json += `"userId": ${typeof this.userId === 'number' || typeof this.userId === 'boolean' ? this.userId : JSON.stringify(this.userId)},`;
    }
    if(this.name !== undefined) {
      json += `"name": ${typeof this.name === 'number' || typeof this.name === 'boolean' ? this.name : JSON.stringify(this.name)},`;
    }
    if(this.description !== undefined) {
      json += `"description": ${typeof this.description === 'number' || typeof this.description === 'boolean' ? this.description : JSON.stringify(this.description)},`;
    }
    if(this.quantity !== undefined) {
      json += `"quantity": ${typeof this.quantity === 'number' || typeof this.quantity === 'boolean' ? this.quantity : JSON.stringify(this.quantity)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","userId","name","description","quantity","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ItemResponse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ItemResponse({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["userId"] !== undefined) {
      instance.userId = obj["userId"];
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"];
    }
    if (obj["description"] !== undefined) {
      instance.description = obj["description"];
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","userId","name","description","quantity","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"id":{"type":"string","description":"The item ID"},"userId":{"type":"string","description":"Owner user ID"},"name":{"type":"string","description":"Name of the item"},"description":{"type":"string","description":"Item description"},"quantity":{"type":"integer","description":"Item quantity"}},"$id":"itemResponse"};
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
  
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { ItemResponse };