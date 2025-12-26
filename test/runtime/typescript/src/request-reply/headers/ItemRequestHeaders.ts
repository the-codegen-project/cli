import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class ItemRequestHeaders {
  private _xCorrelationId: string;
  private _xRequestId?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xRequestId?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xRequestId = input.xRequestId;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Correlation ID for request tracing
   */
  get xCorrelationId(): string { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string) { this._xCorrelationId = xCorrelationId; }

  /**
   * Unique request identifier
   */
  get xRequestId(): string | undefined { return this._xRequestId; }
  set xRequestId(xRequestId: string | undefined) { this._xRequestId = xRequestId; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.xCorrelationId !== undefined) {
      json += `"x-correlation-id": ${typeof this.xCorrelationId === 'number' || typeof this.xCorrelationId === 'boolean' ? this.xCorrelationId : JSON.stringify(this.xCorrelationId)},`;
    }
    if(this.xRequestId !== undefined) {
      json += `"x-request-id": ${typeof this.xRequestId === 'number' || typeof this.xRequestId === 'boolean' ? this.xRequestId : JSON.stringify(this.xRequestId)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-request-id","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): ItemRequestHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new ItemRequestHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"];
    }
    if (obj["x-request-id"] !== undefined) {
      instance.xRequestId = obj["x-request-id"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-request-id","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"x-correlation-id":{"type":"string","description":"Correlation ID for request tracing"},"x-request-id":{"type":"string","description":"Unique request identifier"}},"required":["x-correlation-id"],"$id":"ItemRequestHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { ItemRequestHeaders };