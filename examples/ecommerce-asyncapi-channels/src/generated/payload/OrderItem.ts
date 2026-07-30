import {Money} from './Money';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface OrderItemInterface {
  productId: string
  quantity: number
  unitPrice: Money
  productName?: string
  productCategory?: string
  additionalProperties?: Record<string, any>
}
class OrderItem {
  private _productId: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _productName?: string;
  private _productCategory?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderItemInterface) {
    this._productId = input.productId;
    this._quantity = input.quantity;
    this._unitPrice = input.unitPrice;
    this._productName = input.productName;
    this._productCategory = input.productCategory;
    this._additionalProperties = input.additionalProperties;
  }

  get productId(): string { return this._productId; }
  set productId(productId: string) { this._productId = productId; }

  get quantity(): number { return this._quantity; }
  set quantity(quantity: number) { this._quantity = quantity; }

  get unitPrice(): Money { return this._unitPrice; }
  set unitPrice(unitPrice: Money) { this._unitPrice = unitPrice; }

  get productName(): string | undefined { return this._productName; }
  set productName(productName: string | undefined) { this._productName = productName; }

  get productCategory(): string | undefined { return this._productCategory; }
  set productCategory(productCategory: string | undefined) { this._productCategory = productCategory; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.productId !== undefined) {
      json["productId"] = this.productId;
    }
    if(this.quantity !== undefined) {
      json["quantity"] = this.quantity;
    }
    if(this.unitPrice !== undefined) {
      json["unitPrice"] = this.unitPrice && typeof this.unitPrice === 'object' && 'toJson' in this.unitPrice && typeof this.unitPrice.toJson === 'function' ? this.unitPrice.toJson() : this.unitPrice;
    }
    if(this.productName !== undefined) {
      json["productName"] = this.productName;
    }
    if(this.productCategory !== undefined) {
      json["productCategory"] = this.productCategory;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["productId","quantity","unitPrice","productName","productCategory","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderItem {
    const instance = new OrderItem({} as any);

    if (obj["productId"] !== undefined) {
      instance.productId = obj["productId"] as string;
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"] as number;
    }
    if (obj["unitPrice"] !== undefined) {
      instance.unitPrice = Money.fromJson(obj["unitPrice"] as Record<string, unknown>);
    }
    if (obj["productName"] !== undefined) {
      instance.productName = obj["productName"] as string;
    }
    if (obj["productCategory"] !== undefined) {
      instance.productCategory = obj["productCategory"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["productId","quantity","unitPrice","productName","productCategory","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderItem {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderItem.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","format":"uuid"},"quantity":{"type":"integer","minimum":1},"unitPrice":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"productName":{"type":"string"},"productCategory":{"type":"string"}}};
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
    // `ajv-formats` is CommonJS; its default import is the module namespace under
    // `moduleResolution: node16`/`nodenext`, so unwrap `.default` when present.
    const addFormats = ((addFormatsModule as unknown as {default?: unknown}).default ?? addFormatsModule) as (ajv: Ajv) => Ajv;
    addFormats(ajvInstance);
  
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { OrderItem };
export type { OrderItemInterface };