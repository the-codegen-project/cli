import {SourceService} from './SourceService';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class OrderCreatedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: string;
  private _authorization?: string;
  private _xSourceService?: SourceService;
  private _xApiVersion?: string;
  private _xRequestId?: string;
  private _xUserId: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: string,
    authorization?: string,
    xSourceService?: SourceService,
    xApiVersion?: string,
    xRequestId?: string,
    xUserId: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._authorization = input.authorization;
    this._xSourceService = input.xSourceService;
    this._xApiVersion = input.xApiVersion;
    this._xRequestId = input.xRequestId;
    this._xUserId = input.xUserId;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Unique correlation ID for request tracing
   */
  get xCorrelationId(): string { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string) { this._xCorrelationId = xCorrelationId; }

  /**
   * Multi-tenant identifier
   */
  get xTenantId(): string { return this._xTenantId; }
  set xTenantId(xTenantId: string) { this._xTenantId = xTenantId; }

  /**
   * Event creation timestamp
   */
  get xTimestamp(): string | undefined { return this._xTimestamp; }
  set xTimestamp(xTimestamp: string | undefined) { this._xTimestamp = xTimestamp; }

  /**
   * JWT token for authentication
   */
  get authorization(): string | undefined { return this._authorization; }
  set authorization(authorization: string | undefined) { this._authorization = authorization; }

  /**
   * Service that originated the event
   */
  get xSourceService(): SourceService | undefined { return this._xSourceService; }
  set xSourceService(xSourceService: SourceService | undefined) { this._xSourceService = xSourceService; }

  /**
   * API version used
   */
  get xApiVersion(): string | undefined { return this._xApiVersion; }
  set xApiVersion(xApiVersion: string | undefined) { this._xApiVersion = xApiVersion; }

  /**
   * Original request ID from the client
   */
  get xRequestId(): string | undefined { return this._xRequestId; }
  set xRequestId(xRequestId: string | undefined) { this._xRequestId = xRequestId; }

  /**
   * ID of the user who created the order
   */
  get xUserId(): string { return this._xUserId; }
  set xUserId(xUserId: string) { this._xUserId = xUserId; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.xCorrelationId !== undefined) {
      json += `"x-correlation-id": ${typeof this.xCorrelationId === 'number' || typeof this.xCorrelationId === 'boolean' ? this.xCorrelationId : JSON.stringify(this.xCorrelationId)},`;
    }
    if(this.xTenantId !== undefined) {
      json += `"x-tenant-id": ${typeof this.xTenantId === 'number' || typeof this.xTenantId === 'boolean' ? this.xTenantId : JSON.stringify(this.xTenantId)},`;
    }
    if(this.xTimestamp !== undefined) {
      json += `"x-timestamp": ${typeof this.xTimestamp === 'number' || typeof this.xTimestamp === 'boolean' ? this.xTimestamp : JSON.stringify(this.xTimestamp)},`;
    }
    if(this.authorization !== undefined) {
      json += `"authorization": ${typeof this.authorization === 'number' || typeof this.authorization === 'boolean' ? this.authorization : JSON.stringify(this.authorization)},`;
    }
    if(this.xSourceService !== undefined) {
      json += `"x-source-service": ${typeof this.xSourceService === 'number' || typeof this.xSourceService === 'boolean' ? this.xSourceService : JSON.stringify(this.xSourceService)},`;
    }
    if(this.xApiVersion !== undefined) {
      json += `"x-api-version": ${typeof this.xApiVersion === 'number' || typeof this.xApiVersion === 'boolean' ? this.xApiVersion : JSON.stringify(this.xApiVersion)},`;
    }
    if(this.xRequestId !== undefined) {
      json += `"x-request-id": ${typeof this.xRequestId === 'number' || typeof this.xRequestId === 'boolean' ? this.xRequestId : JSON.stringify(this.xRequestId)},`;
    }
    if(this.xUserId !== undefined) {
      json += `"x-user-id": ${typeof this.xUserId === 'number' || typeof this.xUserId === 'boolean' ? this.xUserId : JSON.stringify(this.xUserId)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","authorization","x-source-service","x-api-version","x-request-id","x-user-id","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): OrderCreatedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new OrderCreatedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"];
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"];
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"];
    }
    if (obj["authorization"] !== undefined) {
      instance.authorization = obj["authorization"];
    }
    if (obj["x-source-service"] !== undefined) {
      instance.xSourceService = obj["x-source-service"];
    }
    if (obj["x-api-version"] !== undefined) {
      instance.xApiVersion = obj["x-api-version"];
    }
    if (obj["x-request-id"] !== undefined) {
      instance.xRequestId = obj["x-request-id"];
    }
    if (obj["x-user-id"] !== undefined) {
      instance.xUserId = obj["x-user-id"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","authorization","x-source-service","x-api-version","x-request-id","x-user-id","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","properties":{"authorization":{"type":"string","pattern":"^Bearer [A-Za-z0-9\\-\\._~\\+\\/]+=*$","description":"JWT token for authentication"}}},{"type":"object","properties":{"x-source-service":{"type":"string","enum":["web-app","mobile-app","admin-panel"],"description":"Service that originated the event"},"x-api-version":{"type":"string","pattern":"^v[0-9]+$","description":"API version used","default":"v1"},"x-request-id":{"type":"string","format":"uuid","description":"Original request ID from the client"}}},{"type":"object","required":["x-user-id"],"properties":{"x-user-id":{"type":"string","format":"uuid","description":"ID of the user who created the order"}}}],"$id":"OrderCreatedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { OrderCreatedHeaders };