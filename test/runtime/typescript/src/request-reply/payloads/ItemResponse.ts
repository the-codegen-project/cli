import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ItemResponseInterface {
  id?: string
  userId?: string
  name?: string
  description?: string
  quantity?: number
  additionalProperties?: Record<string, any>
}
class ItemResponse {
  private _id?: string;
  private _userId?: string;
  private _name?: string;
  private _description?: string;
  private _quantity?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ItemResponseInterface) {
    this._id = input.id;
    this._userId = input.userId;
    this._name = input.name;
    this._description = input.description;
    this._quantity = input.quantity;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * The item ID
   */
  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  /**
   * Owner user ID
   */
  get userId(): string | undefined { return this._userId; }
  set userId(userId: string | undefined) { this._userId = userId; }

  /**
   * Name of the item
   */
  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

  /**
   * Item description
   */
  get description(): string | undefined { return this._description; }
  set description(description: string | undefined) { this._description = description; }

  /**
   * Item quantity
   */
  get quantity(): number | undefined { return this._quantity; }
  set quantity(quantity: number | undefined) { this._quantity = quantity; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.userId !== undefined) {
      json["userId"] = this.userId;
    }
    if(this.name !== undefined) {
      json["name"] = this.name;
    }
    if(this.description !== undefined) {
      json["description"] = this.description;
    }
    if(this.quantity !== undefined) {
      json["quantity"] = this.quantity;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","userId","name","description","quantity","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ItemResponse {
    const instance = new ItemResponse({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["userId"] !== undefined) {
      instance.userId = obj["userId"] as string;
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"] as string;
    }
    if (obj["description"] !== undefined) {
      instance.description = obj["description"] as string;
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","userId","name","description","quantity","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ItemResponse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ItemResponse.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"id":{"type":"string","description":"The item ID"},"userId":{"type":"string","description":"Owner user ID"},"name":{"type":"string","description":"Name of the item"},"description":{"type":"string","description":"Item description"},"quantity":{"type":"integer","description":"Item quantity"}},"$id":"itemResponse"};
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
export { ItemResponse, ItemResponseInterface };