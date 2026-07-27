import {OrderItem} from './OrderItem';
import {Money} from './Money';
import {Address} from './Address';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface OrderCreatedInterface {
  orderId: string
  customerId: string
  items: OrderItem[]
  totalAmount: Money
  shippingAddress?: Address
  createdAt?: Date
  additionalProperties?: Record<string, any>
}
class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: Money;
  private _shippingAddress?: Address;
  private _createdAt?: Date;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderCreatedInterface) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    this._shippingAddress = input.shippingAddress;
    this._createdAt = input.createdAt;
    this._additionalProperties = input.additionalProperties;
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get customerId(): string { return this._customerId; }
  set customerId(customerId: string) { this._customerId = customerId; }

  get items(): OrderItem[] { return this._items; }
  set items(items: OrderItem[]) { this._items = items; }

  get totalAmount(): Money { return this._totalAmount; }
  set totalAmount(totalAmount: Money) { this._totalAmount = totalAmount; }

  get shippingAddress(): Address | undefined { return this._shippingAddress; }
  set shippingAddress(shippingAddress: Address | undefined) { this._shippingAddress = shippingAddress; }

  get createdAt(): Date | undefined { return this._createdAt; }
  set createdAt(createdAt: Date | undefined) { this._createdAt = createdAt; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.orderId !== undefined) {
      json["orderId"] = this.orderId;
    }
    if(this.customerId !== undefined) {
      json["customerId"] = this.customerId;
    }
    if(this.items !== undefined) {
      json["items"] = this.items.map((item: any) =>
        item && typeof item === 'object' && 'toJson' in item && typeof item.toJson === 'function'
          ? item.toJson()
          : item
      );
    }
    if(this.totalAmount !== undefined) {
      json["totalAmount"] = this.totalAmount && typeof this.totalAmount === 'object' && 'toJson' in this.totalAmount && typeof this.totalAmount.toJson === 'function' ? this.totalAmount.toJson() : this.totalAmount;
    }
    if(this.shippingAddress !== undefined) {
      json["shippingAddress"] = this.shippingAddress && typeof this.shippingAddress === 'object' && 'toJson' in this.shippingAddress && typeof this.shippingAddress.toJson === 'function' ? this.shippingAddress.toJson() : this.shippingAddress;
    }
    if(this.createdAt !== undefined) {
      json["createdAt"] = this.createdAt;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","customerId","items","totalAmount","shippingAddress","createdAt","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderCreated {
    const instance = new OrderCreated({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"] as string;
    }
    if (obj["customerId"] !== undefined) {
      instance.customerId = obj["customerId"] as string;
    }
    if (obj["items"] !== undefined) {
      instance.items = (obj["items"] as Record<string, unknown>[]).map((item: Record<string, unknown>) => OrderItem.fromJson(item));
    }
    if (obj["totalAmount"] !== undefined) {
      instance.totalAmount = Money.fromJson(obj["totalAmount"] as Record<string, unknown>);
    }
    if (obj["shippingAddress"] !== undefined) {
      instance.shippingAddress = Address.fromJson(obj["shippingAddress"] as Record<string, unknown>);
    }
    if (obj["createdAt"] !== undefined) {
      instance.createdAt = obj["createdAt"] == null ? undefined : new Date(obj["createdAt"] as string);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","customerId","items","totalAmount","shippingAddress","createdAt","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderCreated {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderCreated.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","customerId","items","totalAmount"],"properties":{"orderId":{"type":"string","format":"uuid"},"customerId":{"type":"string","format":"uuid"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","format":"uuid"},"quantity":{"type":"integer","minimum":1},"unitPrice":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"productName":{"type":"string"},"productCategory":{"type":"string"}}}},"totalAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string"},"postalCode":{"type":"string"}}},"createdAt":{"type":"string","format":"date-time"}},"$id":"OrderCreated"};
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
export { OrderCreated, OrderCreatedInterface };