import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderItem {
  private _productId: string;
  private _quantity: number;
  private _unitPrice: number;
  private _metadata?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    productId: string,
    quantity: number,
    unitPrice: number,
    metadata?: Record<string, any>,
    additionalProperties?: Record<string, any>,
  }) {
    this._productId = input.productId;
    this._quantity = input.quantity;
    this._unitPrice = input.unitPrice;
    this._metadata = input.metadata;
    this._additionalProperties = input.additionalProperties;
  }

  get productId(): string { return this._productId; }
  set productId(productId: string) { this._productId = productId; }

  get quantity(): number { return this._quantity; }
  set quantity(quantity: number) { this._quantity = quantity; }

  get unitPrice(): number { return this._unitPrice; }
  set unitPrice(unitPrice: number) { this._unitPrice = unitPrice; }

  get metadata(): Record<string, any> | undefined { return this._metadata; }
  set metadata(metadata: Record<string, any> | undefined) { this._metadata = metadata; }

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
      json += `"unitPrice": ${typeof this.unitPrice === 'number' || typeof this.unitPrice === 'boolean' ? this.unitPrice : JSON.stringify(this.unitPrice)},`;
    }
    if(this.metadata !== undefined) {
      json += `"metadata": ${typeof this.metadata === 'number' || typeof this.metadata === 'boolean' ? this.metadata : JSON.stringify(this.metadata)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["productId","quantity","unitPrice","metadata","additionalProperties"].includes(String(key))) continue;
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
      instance.unitPrice = obj["unitPrice"];
    }
    if (obj["metadata"] !== undefined) {
      instance.metadata = obj["metadata"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["productId","quantity","unitPrice","metadata","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","description":"Product identifier"},"quantity":{"type":"integer","minimum":1,"description":"Number of items ordered"},"unitPrice":{"type":"number","minimum":0,"description":"Price per unit in cents"},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}}};
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