import {ActorType} from './ActorType';
import {OrderEventType} from './OrderEventType';
import {OrderStatus} from './OrderStatus';
import {OrderReasonCode} from './OrderReasonCode';
import {Priority} from './Priority';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class OrderStatusChangedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: Date;
  private _xActorId?: string;
  private _xActorType?: ActorType;
  private _xEventType: OrderEventType;
  private _xPreviousStatus?: OrderStatus;
  private _xReasonCode?: OrderReasonCode;
  private _xPriority?: Priority;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: Date,
    xActorId?: string,
    xActorType?: ActorType,
    xEventType: OrderEventType,
    xPreviousStatus?: OrderStatus,
    xReasonCode?: OrderReasonCode,
    xPriority?: Priority,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xActorId = input.xActorId;
    this._xActorType = input.xActorType;
    this._xEventType = input.xEventType;
    this._xPreviousStatus = input.xPreviousStatus;
    this._xReasonCode = input.xReasonCode;
    this._xPriority = input.xPriority;
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
  get xTimestamp(): Date | undefined { return this._xTimestamp; }
  set xTimestamp(xTimestamp: Date | undefined) { this._xTimestamp = xTimestamp; }

  /**
   * ID of user/system that triggered the change
   */
  get xActorId(): string | undefined { return this._xActorId; }
  set xActorId(xActorId: string | undefined) { this._xActorId = xActorId; }

  /**
   * Type of actor that triggered the change
   */
  get xActorType(): ActorType | undefined { return this._xActorType; }
  set xActorType(xActorType: ActorType | undefined) { this._xActorType = xActorType; }

  /**
   * Type of status change event
   */
  get xEventType(): OrderEventType { return this._xEventType; }
  set xEventType(xEventType: OrderEventType) { this._xEventType = xEventType; }

  /**
   * Order status values
   */
  get xPreviousStatus(): OrderStatus | undefined { return this._xPreviousStatus; }
  set xPreviousStatus(xPreviousStatus: OrderStatus | undefined) { this._xPreviousStatus = xPreviousStatus; }

  /**
   * Reason code for status change
   */
  get xReasonCode(): OrderReasonCode | undefined { return this._xReasonCode; }
  set xReasonCode(xReasonCode: OrderReasonCode | undefined) { this._xReasonCode = xReasonCode; }

  /**
   * Processing priority
   */
  get xPriority(): Priority | undefined { return this._xPriority; }
  set xPriority(xPriority: Priority | undefined) { this._xPriority = xPriority; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.xCorrelationId !== undefined) {
      json["x-correlation-id"] = this.xCorrelationId;
    }
    if(this.xTenantId !== undefined) {
      json["x-tenant-id"] = this.xTenantId;
    }
    if(this.xTimestamp !== undefined) {
      json["x-timestamp"] = this.xTimestamp;
    }
    if(this.xActorId !== undefined) {
      json["x-actor-id"] = this.xActorId;
    }
    if(this.xActorType !== undefined) {
      json["x-actor-type"] = this.xActorType;
    }
    if(this.xEventType !== undefined) {
      json["x-event-type"] = this.xEventType;
    }
    if(this.xPreviousStatus !== undefined) {
      json["x-previous-status"] = this.xPreviousStatus;
    }
    if(this.xReasonCode !== undefined) {
      json["x-reason-code"] = this.xReasonCode;
    }
    if(this.xPriority !== undefined) {
      json["x-priority"] = this.xPriority;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-actor-id","x-actor-type","x-event-type","x-previous-status","x-reason-code","x-priority","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): OrderStatusChangedHeaders {
    const instance = new OrderStatusChangedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"] as string;
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"] == null ? undefined : new Date(obj["x-timestamp"] as string);
    }
    if (obj["x-actor-id"] !== undefined) {
      instance.xActorId = obj["x-actor-id"] as string;
    }
    if (obj["x-actor-type"] !== undefined) {
      instance.xActorType = obj["x-actor-type"] as ActorType;
    }
    if (obj["x-event-type"] !== undefined) {
      instance.xEventType = obj["x-event-type"] as OrderEventType;
    }
    if (obj["x-previous-status"] !== undefined) {
      instance.xPreviousStatus = obj["x-previous-status"] as OrderStatus;
    }
    if (obj["x-reason-code"] !== undefined) {
      instance.xReasonCode = obj["x-reason-code"] as OrderReasonCode;
    }
    if (obj["x-priority"] !== undefined) {
      instance.xPriority = obj["x-priority"] as Priority;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-actor-id","x-actor-type","x-event-type","x-previous-status","x-reason-code","x-priority","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): OrderStatusChangedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return OrderStatusChangedHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","properties":{"x-actor-id":{"type":"string","format":"uuid","description":"ID of user/system that triggered the change"},"x-actor-type":{"type":"string","enum":["user","system","admin"],"description":"Type of actor that triggered the change"}}},{"type":"object","required":["x-event-type"],"properties":{"x-event-type":{"type":"string","enum":["status-change","cancellation","refund"],"description":"Type of status change event"},"x-previous-status":{"type":"string","enum":["pending","confirmed","processing","shipped","delivered","cancelled"],"description":"Order status values"},"x-reason-code":{"type":"string","enum":["customer-request","payment-failed","inventory-unavailable","fraud-detected"],"description":"Reason code for status change"},"x-priority":{"type":"string","enum":["low","normal","high","urgent"],"default":"normal","description":"Processing priority"}}}],"$id":"OrderStatusChangedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { OrderStatusChangedHeaders };