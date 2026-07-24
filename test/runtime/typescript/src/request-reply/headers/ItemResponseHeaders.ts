import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class ItemResponseHeaders {
  private _xCorrelationId?: string;
  private _xResponseTime?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId?: string,
    xResponseTime?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xResponseTime = input.xResponseTime;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Correlation ID echoed back
   */
  get xCorrelationId(): string | undefined { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string | undefined) { this._xCorrelationId = xCorrelationId; }

  /**
   * Server response time in ms
   */
  get xResponseTime(): string | undefined { return this._xResponseTime; }
  set xResponseTime(xResponseTime: string | undefined) { this._xResponseTime = xResponseTime; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.xCorrelationId !== undefined) {
      json["x-correlation-id"] = this.xCorrelationId;
    }
    if(this.xResponseTime !== undefined) {
      json["x-response-time"] = this.xResponseTime;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-response-time","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): ItemResponseHeaders {
    const instance = new ItemResponseHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-response-time"] !== undefined) {
      instance.xResponseTime = obj["x-response-time"] as string;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-response-time","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): ItemResponseHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return ItemResponseHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"x-correlation-id":{"type":"string","description":"Correlation ID echoed back"},"x-response-time":{"type":"string","description":"Server response time in ms"}},"$id":"ItemResponseHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { ItemResponseHeaders };