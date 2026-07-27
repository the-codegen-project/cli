import {DeviceType} from './DeviceType';
import {Platform} from './Platform';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class UserBehaviorTrackedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: Date;
  private _xSessionId: string;
  private _xUserAgent?: string;
  private _xDeviceType?: DeviceType;
  private _xPlatform?: Platform;
  private _xAbTestGroups?: string[];
  private _xFeatureFlags?: string[];
  private _xGdprConsent?: boolean;
  private _xDataRetentionDays?: number;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: Date,
    xSessionId: string,
    xUserAgent?: string,
    xDeviceType?: DeviceType,
    xPlatform?: Platform,
    xAbTestGroups?: string[],
    xFeatureFlags?: string[],
    xGdprConsent?: boolean,
    xDataRetentionDays?: number,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xSessionId = input.xSessionId;
    this._xUserAgent = input.xUserAgent;
    this._xDeviceType = input.xDeviceType;
    this._xPlatform = input.xPlatform;
    this._xAbTestGroups = input.xAbTestGroups;
    this._xFeatureFlags = input.xFeatureFlags;
    this._xGdprConsent = input.xGdprConsent;
    this._xDataRetentionDays = input.xDataRetentionDays;
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
   * User session identifier
   */
  get xSessionId(): string { return this._xSessionId; }
  set xSessionId(xSessionId: string) { this._xSessionId = xSessionId; }

  /**
   * Browser/app user agent string
   */
  get xUserAgent(): string | undefined { return this._xUserAgent; }
  set xUserAgent(xUserAgent: string | undefined) { this._xUserAgent = xUserAgent; }

  /**
   * Type of device used
   */
  get xDeviceType(): DeviceType | undefined { return this._xDeviceType; }
  set xDeviceType(xDeviceType: DeviceType | undefined) { this._xDeviceType = xDeviceType; }

  /**
   * Platform/app used
   */
  get xPlatform(): Platform | undefined { return this._xPlatform; }
  set xPlatform(xPlatform: Platform | undefined) { this._xPlatform = xPlatform; }

  /**
   * A/B test groups user belongs to
   */
  get xAbTestGroups(): string[] | undefined { return this._xAbTestGroups; }
  set xAbTestGroups(xAbTestGroups: string[] | undefined) { this._xAbTestGroups = xAbTestGroups; }

  /**
   * Active feature flags for user
   */
  get xFeatureFlags(): string[] | undefined { return this._xFeatureFlags; }
  set xFeatureFlags(xFeatureFlags: string[] | undefined) { this._xFeatureFlags = xFeatureFlags; }

  /**
   * Whether user has given GDPR consent
   */
  get xGdprConsent(): boolean | undefined { return this._xGdprConsent; }
  set xGdprConsent(xGdprConsent: boolean | undefined) { this._xGdprConsent = xGdprConsent; }

  /**
   * How long to retain this data
   */
  get xDataRetentionDays(): number | undefined { return this._xDataRetentionDays; }
  set xDataRetentionDays(xDataRetentionDays: number | undefined) { this._xDataRetentionDays = xDataRetentionDays; }

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
    if(this.xSessionId !== undefined) {
      json["x-session-id"] = this.xSessionId;
    }
    if(this.xUserAgent !== undefined) {
      json["x-user-agent"] = this.xUserAgent;
    }
    if(this.xDeviceType !== undefined) {
      json["x-device-type"] = this.xDeviceType;
    }
    if(this.xPlatform !== undefined) {
      json["x-platform"] = this.xPlatform;
    }
    if(this.xAbTestGroups !== undefined) {
      json["x-ab-test-groups"] = this.xAbTestGroups;
    }
    if(this.xFeatureFlags !== undefined) {
      json["x-feature-flags"] = this.xFeatureFlags;
    }
    if(this.xGdprConsent !== undefined) {
      json["x-gdpr-consent"] = this.xGdprConsent;
    }
    if(this.xDataRetentionDays !== undefined) {
      json["x-data-retention-days"] = this.xDataRetentionDays;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-session-id","x-user-agent","x-device-type","x-platform","x-ab-test-groups","x-feature-flags","x-gdpr-consent","x-data-retention-days","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): UserBehaviorTrackedHeaders {
    const instance = new UserBehaviorTrackedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"] as string;
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"] == null ? undefined : new Date(obj["x-timestamp"] as string);
    }
    if (obj["x-session-id"] !== undefined) {
      instance.xSessionId = obj["x-session-id"] as string;
    }
    if (obj["x-user-agent"] !== undefined) {
      instance.xUserAgent = obj["x-user-agent"] as string;
    }
    if (obj["x-device-type"] !== undefined) {
      instance.xDeviceType = obj["x-device-type"] as DeviceType;
    }
    if (obj["x-platform"] !== undefined) {
      instance.xPlatform = obj["x-platform"] as Platform;
    }
    if (obj["x-ab-test-groups"] !== undefined) {
      instance.xAbTestGroups = obj["x-ab-test-groups"] as string[];
    }
    if (obj["x-feature-flags"] !== undefined) {
      instance.xFeatureFlags = obj["x-feature-flags"] as string[];
    }
    if (obj["x-gdpr-consent"] !== undefined) {
      instance.xGdprConsent = obj["x-gdpr-consent"] as boolean;
    }
    if (obj["x-data-retention-days"] !== undefined) {
      instance.xDataRetentionDays = obj["x-data-retention-days"] as number;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-session-id","x-user-agent","x-device-type","x-platform","x-ab-test-groups","x-feature-flags","x-gdpr-consent","x-data-retention-days","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): UserBehaviorTrackedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return UserBehaviorTrackedHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-session-id"],"properties":{"x-session-id":{"type":"string","format":"uuid","description":"User session identifier"}}},{"type":"object","properties":{"x-user-agent":{"type":"string","description":"Browser/app user agent string"},"x-device-type":{"type":"string","enum":["desktop","mobile","tablet","tv","watch"],"description":"Type of device used"},"x-platform":{"type":"string","enum":["web","ios","android","api"],"description":"Platform/app used"}}},{"type":"object","properties":{"x-ab-test-groups":{"type":"array","items":{"type":"string"},"description":"A/B test groups user belongs to"},"x-feature-flags":{"type":"array","items":{"type":"string"},"description":"Active feature flags for user"},"x-gdpr-consent":{"type":"boolean","description":"Whether user has given GDPR consent"},"x-data-retention-days":{"type":"integer","minimum":1,"maximum":2555,"default":365,"description":"How long to retain this data"}}}],"$id":"UserBehaviorTrackedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { UserBehaviorTrackedHeaders };