import {OrderItem} from './OrderItem';
import {Currency} from './Currency';
import {Address} from './Address';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface OrderCreatedInterface {
  orderId: string
  customerId: string
  items: OrderItem[]
  totalAmount: number
  currency: Currency
  shippingAddress?: Address
  metadata?: Record<string, any>
  additionalProperties?: Record<string, any>
}
class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: number;
  private _currency: Currency;
  private _shippingAddress?: Address;
  private _metadata?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderCreatedInterface) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    this._currency = input.currency;
    this._shippingAddress = input.shippingAddress;
    this._metadata = input.metadata;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Unique order identifier
   */
  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  /**
   * Customer who placed the order
   */
  get customerId(): string { return this._customerId; }
  set customerId(customerId: string) { this._customerId = customerId; }

  get items(): OrderItem[] { return this._items; }
  set items(items: OrderItem[]) { this._items = items; }

  /**
   * Total order amount in cents
   */
  get totalAmount(): number { return this._totalAmount; }
  set totalAmount(totalAmount: number) { this._totalAmount = totalAmount; }

  /**
   * Currency code
   */
  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  get shippingAddress(): Address | undefined { return this._shippingAddress; }
  set shippingAddress(shippingAddress: Address | undefined) { this._shippingAddress = shippingAddress; }

  /**
   * Additional metadata
   */
  get metadata(): Record<string, any> | undefined { return this._metadata; }
  set metadata(metadata: Record<string, any> | undefined) { this._metadata = metadata; }

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
      json["totalAmount"] = this.totalAmount;
    }
    if(this.currency !== undefined) {
      json["currency"] = this.currency;
    }
    if(this.shippingAddress !== undefined) {
      json["shippingAddress"] = this.shippingAddress && typeof this.shippingAddress === 'object' && 'toJson' in this.shippingAddress && typeof this.shippingAddress.toJson === 'function' ? this.shippingAddress.toJson() : this.shippingAddress;
    }
    if(this.metadata !== undefined) {
      const serializedMap: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(this.metadata)) {
        serializedMap[key] = value;
      }
      json["metadata"] = serializedMap;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","customerId","items","totalAmount","currency","shippingAddress","metadata","additionalProperties"].includes(String(key))) continue;
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
      instance.totalAmount = obj["totalAmount"] as number;
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"] as Currency;
    }
    if (obj["shippingAddress"] !== undefined) {
      instance.shippingAddress = Address.fromJson(obj["shippingAddress"] as Record<string, unknown>);
    }
    if (obj["metadata"] !== undefined) {
      instance.metadata = obj["metadata"] == null
        ? undefined
        : obj["metadata"] as Record<string, any>;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","customerId","items","totalAmount","currency","shippingAddress","metadata","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderCreated {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderCreated.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","customerId","items","totalAmount","currency"],"properties":{"orderId":{"type":"string","format":"uuid","description":"Unique order identifier"},"customerId":{"type":"string","format":"uuid","description":"Customer who placed the order"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","description":"Product identifier"},"quantity":{"type":"integer","minimum":1,"description":"Number of items ordered"},"unitPrice":{"type":"number","minimum":0,"description":"Price per unit in cents"},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}}}},"totalAmount":{"type":"number","minimum":0,"description":"Total order amount in cents"},"currency":{"type":"string","enum":["USD","EUR","GBP"],"description":"Currency code"},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string","minLength":2,"maxLength":2,"description":"ISO 3166-1 alpha-2 country code"},"postalCode":{"type":"string"}}},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}},"$id":"OrderCreated"};
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
export { OrderCreated };
export type { OrderCreatedInterface };