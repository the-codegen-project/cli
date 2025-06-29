import {OrderItem} from './OrderItem';
import {Money} from './Money';
import {Address} from './Address';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: Money;
  private _shippingAddress?: Address;
  private _createdAt?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    customerId: string,
    items: OrderItem[],
    totalAmount: Money,
    shippingAddress?: Address,
    createdAt?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  get createdAt(): string | undefined { return this._createdAt; }
  set createdAt(createdAt: string | undefined) { this._createdAt = createdAt; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.orderId !== undefined) {
      json += `"orderId": ${typeof this.orderId === 'number' || typeof this.orderId === 'boolean' ? this.orderId : JSON.stringify(this.orderId)},`;
    }
    if(this.customerId !== undefined) {
      json += `"customerId": ${typeof this.customerId === 'number' || typeof this.customerId === 'boolean' ? this.customerId : JSON.stringify(this.customerId)},`;
    }
    if(this.items !== undefined) {
      let itemsJsonValues: any[] = [];
      for (const unionItem of this.items) {
        itemsJsonValues.push(`${unionItem.marshal()}`);
      }
      json += `"items": [${itemsJsonValues.join(',')}],`;
    }
    if(this.totalAmount !== undefined) {
      json += `"totalAmount": ${this.totalAmount.marshal()},`;
    }
    if(this.shippingAddress !== undefined) {
      json += `"shippingAddress": ${this.shippingAddress.marshal()},`;
    }
    if(this.createdAt !== undefined) {
      json += `"createdAt": ${typeof this.createdAt === 'number' || typeof this.createdAt === 'boolean' ? this.createdAt : JSON.stringify(this.createdAt)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","customerId","items","totalAmount","shippingAddress","createdAt","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderCreated {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderCreated({} as any);

    if (obj["orderId"] !== undefined) {
      instance.orderId = obj["orderId"];
    }
    if (obj["customerId"] !== undefined) {
      instance.customerId = obj["customerId"];
    }
    if (obj["items"] !== undefined) {
      instance.items = obj["items"] == null
        ? null
        : obj["items"].map((item: any) => OrderItem.unmarshal(item));
    }
    if (obj["totalAmount"] !== undefined) {
      instance.totalAmount = Money.unmarshal(obj["totalAmount"]);
    }
    if (obj["shippingAddress"] !== undefined) {
      instance.shippingAddress = Address.unmarshal(obj["shippingAddress"]);
    }
    if (obj["createdAt"] !== undefined) {
      instance.createdAt = obj["createdAt"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","customerId","items","totalAmount","shippingAddress","createdAt","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","customerId","items","totalAmount"],"properties":{"orderId":{"type":"string","format":"uuid"},"customerId":{"type":"string","format":"uuid"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","format":"uuid"},"quantity":{"type":"integer","minimum":1},"unitPrice":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"productName":{"type":"string"},"productCategory":{"type":"string"}}}},"totalAmount":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string"},"postalCode":{"type":"string"}}},"createdAt":{"type":"string","format":"date-time"}},"$id":"OrderCreated"};
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
export { OrderCreated };