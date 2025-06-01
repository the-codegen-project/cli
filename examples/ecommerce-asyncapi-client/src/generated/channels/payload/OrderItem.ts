import {Money} from './Money';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderItem {
  private _productId: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _productName?: string;
  private _productCategory?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    productId: string,
    quantity: number,
    unitPrice: Money,
    productName?: string,
    productCategory?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.productId !== undefined) {
      json += `"productId": ${typeof this.productId === 'number' || typeof this.productId === 'boolean' ? this.productId : JSON.stringify(this.productId)},`;
    }
    if(this.quantity !== undefined) {
      json += `"quantity": ${typeof this.quantity === 'number' || typeof this.quantity === 'boolean' ? this.quantity : JSON.stringify(this.quantity)},`;
    }
    if(this.unitPrice !== undefined) {
      json += `"unitPrice": ${this.unitPrice.marshal()},`;
    }
    if(this.productName !== undefined) {
      json += `"productName": ${typeof this.productName === 'number' || typeof this.productName === 'boolean' ? this.productName : JSON.stringify(this.productName)},`;
    }
    if(this.productCategory !== undefined) {
      json += `"productCategory": ${typeof this.productCategory === 'number' || typeof this.productCategory === 'boolean' ? this.productCategory : JSON.stringify(this.productCategory)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["productId","quantity","unitPrice","productName","productCategory","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderItem {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderItem({} as any);

    if (obj["productId"] !== undefined) {
      instance.productId = obj["productId"];
    }
    if (obj["quantity"] !== undefined) {
      instance.quantity = obj["quantity"];
    }
    if (obj["unitPrice"] !== undefined) {
      instance.unitPrice = Money.unmarshal(obj["unitPrice"]);
    }
    if (obj["productName"] !== undefined) {
      instance.productName = obj["productName"];
    }
    if (obj["productCategory"] !== undefined) {
      instance.productCategory = obj["productCategory"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["productId","quantity","unitPrice","productName","productCategory","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","format":"uuid"},"quantity":{"type":"integer","minimum":1},"unitPrice":{"type":"object","required":["amount","currency"],"properties":{"amount":{"type":"integer","minimum":0,"description":"Amount in smallest currency unit (e.g., cents for USD)"},"currency":{"type":"string","enum":["USD","EUR","GBP"]}}},"productName":{"type":"string"},"productCategory":{"type":"string"}}};
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
export { OrderItem };