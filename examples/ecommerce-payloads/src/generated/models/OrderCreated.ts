import {OrderItem} from './OrderItem';
import {Currency} from './Currency';
import {Address} from './Address';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: number;
  private _currency: Currency;
  private _shippingAddress?: Address;
  private _metadata?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    customerId: string,
    items: OrderItem[],
    totalAmount: number,
    currency: Currency,
    shippingAddress?: Address,
    metadata?: Record<string, any>,
    additionalProperties?: Record<string, any>,
  }) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    this._currency = input.currency;
    this._shippingAddress = input.shippingAddress;
    this._metadata = input.metadata;
    this._additionalProperties = input.additionalProperties;
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  get customerId(): string { return this._customerId; }
  set customerId(customerId: string) { this._customerId = customerId; }

  get items(): OrderItem[] { return this._items; }
  set items(items: OrderItem[]) { this._items = items; }

  get totalAmount(): number { return this._totalAmount; }
  set totalAmount(totalAmount: number) { this._totalAmount = totalAmount; }

  get currency(): Currency { return this._currency; }
  set currency(currency: Currency) { this._currency = currency; }

  get shippingAddress(): Address | undefined { return this._shippingAddress; }
  set shippingAddress(shippingAddress: Address | undefined) { this._shippingAddress = shippingAddress; }

  get metadata(): Record<string, any> | undefined { return this._metadata; }
  set metadata(metadata: Record<string, any> | undefined) { this._metadata = metadata; }

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
      json += `"totalAmount": ${typeof this.totalAmount === 'number' || typeof this.totalAmount === 'boolean' ? this.totalAmount : JSON.stringify(this.totalAmount)},`;
    }
    if(this.currency !== undefined) {
      json += `"currency": ${typeof this.currency === 'number' || typeof this.currency === 'boolean' ? this.currency : JSON.stringify(this.currency)},`;
    }
    if(this.shippingAddress !== undefined) {
      json += `"shippingAddress": ${this.shippingAddress.marshal()},`;
    }
    if(this.metadata !== undefined) {
      json += `"metadata": ${typeof this.metadata === 'number' || typeof this.metadata === 'boolean' ? this.metadata : JSON.stringify(this.metadata)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["orderId","customerId","items","totalAmount","currency","shippingAddress","metadata","additionalProperties"].includes(String(key))) continue;
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
      instance.totalAmount = obj["totalAmount"];
    }
    if (obj["currency"] !== undefined) {
      instance.currency = obj["currency"];
    }
    if (obj["shippingAddress"] !== undefined) {
      instance.shippingAddress = Address.unmarshal(obj["shippingAddress"]);
    }
    if (obj["metadata"] !== undefined) {
      instance.metadata = obj["metadata"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["orderId","customerId","items","totalAmount","currency","shippingAddress","metadata","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["orderId","customerId","items","totalAmount","currency"],"properties":{"orderId":{"type":"string","format":"uuid","description":"Unique order identifier"},"customerId":{"type":"string","format":"uuid","description":"Customer who placed the order"},"items":{"type":"array","items":{"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","description":"Product identifier"},"quantity":{"type":"integer","minimum":1,"description":"Number of items ordered"},"unitPrice":{"type":"number","minimum":0,"description":"Price per unit in cents"},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}}}},"totalAmount":{"type":"number","minimum":0,"description":"Total order amount in cents"},"currency":{"type":"string","enum":["USD","EUR","GBP"],"description":"Currency code"},"shippingAddress":{"type":"object","required":["street","city","country","postalCode"],"properties":{"street":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string","minLength":2,"maxLength":2,"description":"ISO 3166-1 alpha-2 country code"},"postalCode":{"type":"string"}}},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}},"$id":"OrderCreated"};
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