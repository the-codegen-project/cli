import {AdminActionType} from './AdminActionType';
import {PermissionLevel} from './PermissionLevel';
import {AuditLevel} from './AuditLevel';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class AdminActionPerformedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: Date;
  private _xAdminId: string;
  private _xActionType: AdminActionType;
  private _xPermissionLevel?: PermissionLevel;
  private _xAuditLevel?: AuditLevel;
  private _xApprovalRequired?: boolean;
  private _xApprovedBy?: string;
  private _xWebhookSignature?: string;
  private _xIpAddress?: string;
  private _xComplianceTags?: string[];
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: Date,
    xAdminId: string,
    xActionType: AdminActionType,
    xPermissionLevel?: PermissionLevel,
    xAuditLevel?: AuditLevel,
    xApprovalRequired?: boolean,
    xApprovedBy?: string,
    xWebhookSignature?: string,
    xIpAddress?: string,
    xComplianceTags?: string[],
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xAdminId = input.xAdminId;
    this._xActionType = input.xActionType;
    this._xPermissionLevel = input.xPermissionLevel;
    this._xAuditLevel = input.xAuditLevel;
    this._xApprovalRequired = input.xApprovalRequired;
    this._xApprovedBy = input.xApprovedBy;
    this._xWebhookSignature = input.xWebhookSignature;
    this._xIpAddress = input.xIpAddress;
    this._xComplianceTags = input.xComplianceTags;
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
   * ID of admin performing action
   */
  get xAdminId(): string { return this._xAdminId; }
  set xAdminId(xAdminId: string) { this._xAdminId = xAdminId; }

  /**
   * Category of admin action
   */
  get xActionType(): AdminActionType { return this._xActionType; }
  set xActionType(xActionType: AdminActionType) { this._xActionType = xActionType; }

  /**
   * Permission level required for action
   */
  get xPermissionLevel(): PermissionLevel | undefined { return this._xPermissionLevel; }
  set xPermissionLevel(xPermissionLevel: PermissionLevel | undefined) { this._xPermissionLevel = xPermissionLevel; }

  /**
   * Audit importance level
   */
  get xAuditLevel(): AuditLevel | undefined { return this._xAuditLevel; }
  set xAuditLevel(xAuditLevel: AuditLevel | undefined) { this._xAuditLevel = xAuditLevel; }

  /**
   * Whether action requires approval
   */
  get xApprovalRequired(): boolean | undefined { return this._xApprovalRequired; }
  set xApprovalRequired(xApprovalRequired: boolean | undefined) { this._xApprovalRequired = xApprovalRequired; }

  /**
   * ID of approving admin (if applicable)
   */
  get xApprovedBy(): string | undefined { return this._xApprovedBy; }
  set xApprovedBy(xApprovedBy: string | undefined) { this._xApprovedBy = xApprovedBy; }

  /**
   * Webhook signature for verification
   */
  get xWebhookSignature(): string | undefined { return this._xWebhookSignature; }
  set xWebhookSignature(xWebhookSignature: string | undefined) { this._xWebhookSignature = xWebhookSignature; }

  /**
   * IP address
   */
  get xIpAddress(): string | undefined { return this._xIpAddress; }
  set xIpAddress(xIpAddress: string | undefined) { this._xIpAddress = xIpAddress; }

  /**
   * Compliance/regulatory tags
   */
  get xComplianceTags(): string[] | undefined { return this._xComplianceTags; }
  set xComplianceTags(xComplianceTags: string[] | undefined) { this._xComplianceTags = xComplianceTags; }

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
    if(this.xAdminId !== undefined) {
      json["x-admin-id"] = this.xAdminId;
    }
    if(this.xActionType !== undefined) {
      json["x-action-type"] = this.xActionType;
    }
    if(this.xPermissionLevel !== undefined) {
      json["x-permission-level"] = this.xPermissionLevel;
    }
    if(this.xAuditLevel !== undefined) {
      json["x-audit-level"] = this.xAuditLevel;
    }
    if(this.xApprovalRequired !== undefined) {
      json["x-approval-required"] = this.xApprovalRequired;
    }
    if(this.xApprovedBy !== undefined) {
      json["x-approved-by"] = this.xApprovedBy;
    }
    if(this.xWebhookSignature !== undefined) {
      json["x-webhook-signature"] = this.xWebhookSignature;
    }
    if(this.xIpAddress !== undefined) {
      json["x-ip-address"] = this.xIpAddress;
    }
    if(this.xComplianceTags !== undefined) {
      json["x-compliance-tags"] = this.xComplianceTags;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-admin-id","x-action-type","x-permission-level","x-audit-level","x-approval-required","x-approved-by","x-webhook-signature","x-ip-address","x-compliance-tags","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): AdminActionPerformedHeaders {
    const instance = new AdminActionPerformedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"] as string;
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"] == null ? undefined : new Date(obj["x-timestamp"] as string);
    }
    if (obj["x-admin-id"] !== undefined) {
      instance.xAdminId = obj["x-admin-id"] as string;
    }
    if (obj["x-action-type"] !== undefined) {
      instance.xActionType = obj["x-action-type"] as AdminActionType;
    }
    if (obj["x-permission-level"] !== undefined) {
      instance.xPermissionLevel = obj["x-permission-level"] as PermissionLevel;
    }
    if (obj["x-audit-level"] !== undefined) {
      instance.xAuditLevel = obj["x-audit-level"] as AuditLevel;
    }
    if (obj["x-approval-required"] !== undefined) {
      instance.xApprovalRequired = obj["x-approval-required"] as boolean;
    }
    if (obj["x-approved-by"] !== undefined) {
      instance.xApprovedBy = obj["x-approved-by"] as string;
    }
    if (obj["x-webhook-signature"] !== undefined) {
      instance.xWebhookSignature = obj["x-webhook-signature"] as string;
    }
    if (obj["x-ip-address"] !== undefined) {
      instance.xIpAddress = obj["x-ip-address"] as string;
    }
    if (obj["x-compliance-tags"] !== undefined) {
      instance.xComplianceTags = obj["x-compliance-tags"] as string[];
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-admin-id","x-action-type","x-permission-level","x-audit-level","x-approval-required","x-approved-by","x-webhook-signature","x-ip-address","x-compliance-tags","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): AdminActionPerformedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return AdminActionPerformedHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-admin-id","x-action-type"],"properties":{"x-admin-id":{"type":"string","format":"uuid","description":"ID of admin performing action"},"x-action-type":{"type":"string","enum":["user-management","order-management","inventory-management","system-config"],"description":"Category of admin action"},"x-permission-level":{"type":"string","enum":["read","write","admin","super-admin"],"description":"Permission level required for action"},"x-audit-level":{"type":"string","enum":["low","medium","high","critical"],"description":"Audit importance level"},"x-approval-required":{"type":"boolean","default":false,"description":"Whether action requires approval"},"x-approved-by":{"type":"string","format":"uuid","description":"ID of approving admin (if applicable)"}}},{"type":"object","properties":{"x-webhook-signature":{"type":"string","description":"Webhook signature for verification"},"x-ip-address":{"type":"string","format":"ipv4","description":"IP address"}}},{"type":"object","properties":{"x-compliance-tags":{"type":"array","items":{"type":"string"},"description":"Compliance/regulatory tags"}}}],"$id":"AdminActionPerformedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { AdminActionPerformedHeaders };