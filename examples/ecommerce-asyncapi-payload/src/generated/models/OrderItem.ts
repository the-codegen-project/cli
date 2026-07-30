import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface OrderItemInterface {
  productId: string
  quantity: number
  unitPrice: number
  metadata?: Record<string, any>
  additionalProperties?: Record<string, any>
}
class OrderItem {
  private _productId: string;
  private _quantity: number;
  private _unitPrice: number;
  private _metadata?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderItemInterface) {
    this._productId = input.productId;
    this._quantity = input.quantity;
    this._unitPrice = input.unitPrice;
    this._metadata = input.metadata;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Product identifier
   */
  get productId(): string { return this._productId; }
  set productId(productId: string) { this._productId = productId; }

  /**
   * Number of items ordered
   */
  get quantity(): number { return this._quantity; }
  set quantity(quantity: number) { this._quantity = quantity; }

  /**
   * Price per unit in cents
   */
  get unitPrice(): number { return this._unitPrice; }
  set unitPrice(unitPrice: number) { this._unitPrice = unitPrice; }

  /**
   * Additional metadata
   */
  get metadata(): Record<string, any> | undefined { return this._metadata; }
  set metadata(metadata: Record<string, any> | undefined) { this._metadata = metadata; }

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
      json["unitPrice"] = this.unitPrice;
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
        if(["productId","quantity","unitPrice","metadata","additionalProperties"].includes(String(key))) continue;
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
      instance.unitPrice = obj["unitPrice"] as number;
    }
    if (obj["metadata"] !== undefined) {
      instance.metadata = obj["metadata"] == null
        ? undefined
        : obj["metadata"] as Record<string, any>;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["productId","quantity","unitPrice","metadata","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderItem {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderItem.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["productId","quantity","unitPrice"],"properties":{"productId":{"type":"string","description":"Product identifier"},"quantity":{"type":"integer","minimum":1,"description":"Number of items ordered"},"unitPrice":{"type":"number","minimum":0,"description":"Price per unit in cents"},"metadata":{"type":"object","additionalProperties":true,"description":"Additional metadata"}}};
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