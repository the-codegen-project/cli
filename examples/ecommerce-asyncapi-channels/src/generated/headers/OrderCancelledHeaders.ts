import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
class OrderCancelledHeaders {
  private _xCorrelationId: string;
  private _xOrderId: string;
  private _xCustomerId: string;
  private _xSourceService?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xOrderId: string,
    xCustomerId: string,
    xSourceService?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xOrderId = input.xOrderId;
    this._xCustomerId = input.xCustomerId;
    this._xSourceService = input.xSourceService;
    this._additionalProperties = input.additionalProperties;
  }

  get xCorrelationId(): string { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string) { this._xCorrelationId = xCorrelationId; }

  get xOrderId(): string { return this._xOrderId; }
  set xOrderId(xOrderId: string) { this._xOrderId = xOrderId; }

  get xCustomerId(): string { return this._xCustomerId; }
  set xCustomerId(xCustomerId: string) { this._xCustomerId = xCustomerId; }

  get xSourceService(): string | undefined { return this._xSourceService; }
  set xSourceService(xSourceService: string | undefined) { this._xSourceService = xSourceService; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.xCorrelationId !== undefined) {
      json["x-correlation-id"] = this.xCorrelationId;
    }
    if(this.xOrderId !== undefined) {
      json["x-order-id"] = this.xOrderId;
    }
    if(this.xCustomerId !== undefined) {
      json["x-customer-id"] = this.xCustomerId;
    }
    if(this.xSourceService !== undefined) {
      json["x-source-service"] = this.xSourceService;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-order-id","x-customer-id","x-source-service","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderCancelledHeaders {
    const instance = new OrderCancelledHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-order-id"] !== undefined) {
      instance.xOrderId = obj["x-order-id"] as string;
    }
    if (obj["x-customer-id"] !== undefined) {
      instance.xCustomerId = obj["x-customer-id"] as string;
    }
    if (obj["x-source-service"] !== undefined) {
      instance.xSourceService = obj["x-source-service"] as string;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-order-id","x-customer-id","x-source-service","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderCancelledHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderCancelledHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["x-correlation-id","x-order-id","x-customer-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid"},"x-order-id":{"type":"string","format":"uuid"},"x-customer-id":{"type":"string","format":"uuid"},"x-source-service":{"type":"string"}},"$id":"OrderCancelledHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { OrderCancelledHeaders };