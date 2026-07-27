import {PaymentProvider} from './PaymentProvider';
import {PaymentMethod} from './PaymentMethod';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class PaymentProcessedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: Date;
  private _xPaymentProvider: PaymentProvider;
  private _xPaymentMethod?: PaymentMethod;
  private _xRiskScore?: number;
  private _xProcessorTransactionId?: string;
  private _xRetryCount?: number;
  private _xIdempotencyKey?: string;
  private _xWebhookSignature?: string;
  private _xIpAddress?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xCorrelationId: string,
    xTenantId: string,
    xTimestamp?: Date,
    xPaymentProvider: PaymentProvider,
    xPaymentMethod?: PaymentMethod,
    xRiskScore?: number,
    xProcessorTransactionId?: string,
    xRetryCount?: number,
    xIdempotencyKey?: string,
    xWebhookSignature?: string,
    xIpAddress?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xCorrelationId = input.xCorrelationId;
    this._xTenantId = input.xTenantId;
    this._xTimestamp = input.xTimestamp;
    this._xPaymentProvider = input.xPaymentProvider;
    this._xPaymentMethod = input.xPaymentMethod;
    this._xRiskScore = input.xRiskScore;
    this._xProcessorTransactionId = input.xProcessorTransactionId;
    this._xRetryCount = input.xRetryCount;
    this._xIdempotencyKey = input.xIdempotencyKey;
    this._xWebhookSignature = input.xWebhookSignature;
    this._xIpAddress = input.xIpAddress;
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
   * Payment processor used
   */
  get xPaymentProvider(): PaymentProvider { return this._xPaymentProvider; }
  set xPaymentProvider(xPaymentProvider: PaymentProvider) { this._xPaymentProvider = xPaymentProvider; }

  /**
   * Payment method used
   */
  get xPaymentMethod(): PaymentMethod | undefined { return this._xPaymentMethod; }
  set xPaymentMethod(xPaymentMethod: PaymentMethod | undefined) { this._xPaymentMethod = xPaymentMethod; }

  /**
   * Fraud risk score (0-100)
   */
  get xRiskScore(): number | undefined { return this._xRiskScore; }
  set xRiskScore(xRiskScore: number | undefined) { this._xRiskScore = xRiskScore; }

  /**
   * Transaction ID from payment processor
   */
  get xProcessorTransactionId(): string | undefined { return this._xProcessorTransactionId; }
  set xProcessorTransactionId(xProcessorTransactionId: string | undefined) { this._xProcessorTransactionId = xProcessorTransactionId; }

  /**
   * Number of retry attempts
   */
  get xRetryCount(): number | undefined { return this._xRetryCount; }
  set xRetryCount(xRetryCount: number | undefined) { this._xRetryCount = xRetryCount; }

  /**
   * Ensures payment processing idempotency
   */
  get xIdempotencyKey(): string | undefined { return this._xIdempotencyKey; }
  set xIdempotencyKey(xIdempotencyKey: string | undefined) { this._xIdempotencyKey = xIdempotencyKey; }

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
    if(this.xPaymentProvider !== undefined) {
      json["x-payment-provider"] = this.xPaymentProvider;
    }
    if(this.xPaymentMethod !== undefined) {
      json["x-payment-method"] = this.xPaymentMethod;
    }
    if(this.xRiskScore !== undefined) {
      json["x-risk-score"] = this.xRiskScore;
    }
    if(this.xProcessorTransactionId !== undefined) {
      json["x-processor-transaction-id"] = this.xProcessorTransactionId;
    }
    if(this.xRetryCount !== undefined) {
      json["x-retry-count"] = this.xRetryCount;
    }
    if(this.xIdempotencyKey !== undefined) {
      json["x-idempotency-key"] = this.xIdempotencyKey;
    }
    if(this.xWebhookSignature !== undefined) {
      json["x-webhook-signature"] = this.xWebhookSignature;
    }
    if(this.xIpAddress !== undefined) {
      json["x-ip-address"] = this.xIpAddress;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-payment-provider","x-payment-method","x-risk-score","x-processor-transaction-id","x-retry-count","x-idempotency-key","x-webhook-signature","x-ip-address","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): PaymentProcessedHeaders {
    const instance = new PaymentProcessedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"] as string;
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"] as string;
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"] == null ? undefined : new Date(obj["x-timestamp"] as string);
    }
    if (obj["x-payment-provider"] !== undefined) {
      instance.xPaymentProvider = obj["x-payment-provider"] as PaymentProvider;
    }
    if (obj["x-payment-method"] !== undefined) {
      instance.xPaymentMethod = obj["x-payment-method"] as PaymentMethod;
    }
    if (obj["x-risk-score"] !== undefined) {
      instance.xRiskScore = obj["x-risk-score"] as number;
    }
    if (obj["x-processor-transaction-id"] !== undefined) {
      instance.xProcessorTransactionId = obj["x-processor-transaction-id"] as string;
    }
    if (obj["x-retry-count"] !== undefined) {
      instance.xRetryCount = obj["x-retry-count"] as number;
    }
    if (obj["x-idempotency-key"] !== undefined) {
      instance.xIdempotencyKey = obj["x-idempotency-key"] as string;
    }
    if (obj["x-webhook-signature"] !== undefined) {
      instance.xWebhookSignature = obj["x-webhook-signature"] as string;
    }
    if (obj["x-ip-address"] !== undefined) {
      instance.xIpAddress = obj["x-ip-address"] as string;
    }

    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-payment-provider","x-payment-method","x-risk-score","x-processor-transaction-id","x-retry-count","x-idempotency-key","x-webhook-signature","x-ip-address","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }

  public static unmarshal(json: string | object): PaymentProcessedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return PaymentProcessedHeaders.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-payment-provider"],"properties":{"x-payment-provider":{"type":"string","enum":["stripe","paypal","square","adyen"],"description":"Payment processor used"},"x-payment-method":{"type":"string","enum":["credit-card","debit-card","bank-transfer","digital-wallet"],"description":"Payment method used"},"x-risk-score":{"type":"number","minimum":0,"maximum":100,"description":"Fraud risk score (0-100)"},"x-processor-transaction-id":{"type":"string","description":"Transaction ID from payment processor"},"x-retry-count":{"type":"integer","minimum":0,"maximum":5,"default":0,"description":"Number of retry attempts"},"x-idempotency-key":{"type":"string","format":"uuid","description":"Ensures payment processing idempotency"}}},{"type":"object","properties":{"x-webhook-signature":{"type":"string","description":"Webhook signature for verification"},"x-ip-address":{"type":"string","format":"ipv4","description":"IP address"}}}],"$id":"PaymentProcessedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { PaymentProcessedHeaders };