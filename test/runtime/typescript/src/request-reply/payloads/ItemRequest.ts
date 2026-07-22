import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface ItemRequestInterface {
  name: string
  description?: string
  quantity?: number
  additionalProperties?: Record<string, any>
}
class ItemRequest {
  private _name: string;
  private _description?: string;
  private _quantity?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: ItemRequestInterface) {
    this._name = input.name;
    this._description = input.description;
    this._quantity = input.quantity;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Name of the item
   */
  get name(): string { return this._name; }
  set name(name: string) { this._name = name; }

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
        if(["name","description","quantity","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ItemRequest {
    const instance = new ItemRequest({} as any);

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
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["name","description","quantity","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): ItemRequest {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ItemRequest.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"name":{"type":"string","description":"Name of the item"},"description":{"type":"string","description":"Item description"},"quantity":{"type":"integer","description":"Item quantity"}},"required":["name"],"$id":"itemRequest"};
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
export { ItemRequest, ItemRequestInterface };