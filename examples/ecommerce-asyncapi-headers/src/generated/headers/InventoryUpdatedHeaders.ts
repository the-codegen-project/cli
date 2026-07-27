import {InventoryUpdateType} from './InventoryUpdateType';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class InventoryUpdatedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: Date;
  private _xWarehouseId: string;
  private _xUpdateType?: InventoryUpdateType;
  private _xBatchId?: string;
  private _xLocation?: string;
  private _xOperatorId?: string;
  private _xAuditRequired?: boolean;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: Date,
    xWarehouseId: string,
    xUpdateType?: InventoryUpdateType,
    xBatchId?: string,
    xLocation?: string,
    xOperatorId?: string,
    xAuditRequired?: boolean,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xWarehouseId = input.xWarehouseId;
    this._xUpdateType = input.xUpdateType;
    this._xBatchId = input.xBatchId;
    this._xLocation = input.xLocation;
    this._xOperatorId = input.xOperatorId;
    this._xAuditRequired = input.xAuditRequired;
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
   * Warehouse where inventory changed
   */
  get xWarehouseId(): string { return this._xWarehouseId; }
  set xWarehouseId(xWarehouseId: string) { this._xWarehouseId = xWarehouseId; }

  /**
   * Type of inventory update
   */
  get xUpdateType(): InventoryUpdateType | undefined { return this._xUpdateType; }
  set xUpdateType(xUpdateType: InventoryUpdateType | undefined) { this._xUpdateType = xUpdateType; }

  /**
   * Batch ID for bulk operations
   */
  get xBatchId(): string | undefined { return this._xBatchId; }
  set xBatchId(xBatchId: string | undefined) { this._xBatchId = xBatchId; }

  /**
   * Specific location within warehouse
   */
  get xLocation(): string | undefined { return this._xLocation; }
  set xLocation(xLocation: string | undefined) { this._xLocation = xLocation; }

  /**
   * ID of person/system making the change
   */
  get xOperatorId(): string | undefined { return this._xOperatorId; }
  set xOperatorId(xOperatorId: string | undefined) { this._xOperatorId = xOperatorId; }

  /**
   * Whether this change requires audit
   */
  get xAuditRequired(): boolean | undefined { return this._xAuditRequired; }
  set xAuditRequired(xAuditRequired: boolean | undefined) { this._xAuditRequired = xAuditRequired; }

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
    if(this.xWarehouseId !== undefined) {
      json["x-warehouse-id"] = this.xWarehouseId;
    }
    if(this.xUpdateType !== undefined) {
      json["x-update-type"] = this.xUpdateType;
    }
    if(this.xBatchId !== undefined) {
      json["x-batch-id"] = this.xBatchId;
    }
    if(this.xLocation !== undefined) {
      json["x-location"] = this.xLocation;
    }
    if(this.xOperatorId !== undefined) {
      json["x-operator-id"] = this.xOperatorId;
    }
    if(this.xAuditRequired !== undefined) {
      json["x-audit-required"] = this.xAuditRequired;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-warehouse-id","x-update-type","x-batch-id","x-location","x-operator-id","x-audit-required","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): InventoryUpdatedHeaders {
    const instance = new InventoryUpdatedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"] as string;
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"] == null ? undefined : new Date(obj["x-timestamp"] as string);
    }
    if (obj["x-warehouse-id"] !== undefined) {
      instance.xWarehouseId = obj["x-warehouse-id"] as string;
    }
    if (obj["x-update-type"] !== undefined) {
      instance.xUpdateType = obj["x-update-type"] as InventoryUpdateType;
    }
    if (obj["x-batch-id"] !== undefined) {
      instance.xBatchId = obj["x-batch-id"] as string;
    }
    if (obj["x-location"] !== undefined) {
      instance.xLocation = obj["x-location"] as string;
    }
    if (obj["x-operator-id"] !== undefined) {
      instance.xOperatorId = obj["x-operator-id"] as string;
    }
    if (obj["x-audit-required"] !== undefined) {
      instance.xAuditRequired = obj["x-audit-required"] as boolean;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-warehouse-id","x-update-type","x-batch-id","x-location","x-operator-id","x-audit-required","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): InventoryUpdatedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return InventoryUpdatedHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-warehouse-id"],"properties":{"x-warehouse-id":{"type":"string","description":"Warehouse where inventory changed"},"x-update-type":{"type":"string","enum":["restock","sale","adjustment","damage","return"],"description":"Type of inventory update"},"x-batch-id":{"type":"string","format":"uuid","description":"Batch ID for bulk operations"},"x-location":{"type":"string","description":"Specific location within warehouse"}}},{"type":"object","properties":{"x-operator-id":{"type":"string","format":"uuid","description":"ID of person/system making the change"},"x-audit-required":{"type":"boolean","default":false,"description":"Whether this change requires audit"}}}],"$id":"InventoryUpdatedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { InventoryUpdatedHeaders };