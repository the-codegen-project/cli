import {PaymentProvider} from './PaymentProvider';
import {PaymentMethod} from './PaymentMethod';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class PaymentProcessedHeaders {
  private _xCorrelationId: string;
  private _xTenantId: string;
  private _xTimestamp?: string;
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
    xTimestamp?: string,
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
  get xTimestamp(): string | undefined { return this._xTimestamp; }
  set xTimestamp(xTimestamp: string | undefined) { this._xTimestamp = xTimestamp; }

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
    if(this.xPaymentProvider !== undefined) {
      json += `"x-payment-provider": ${typeof this.xPaymentProvider === 'number' || typeof this.xPaymentProvider === 'boolean' ? this.xPaymentProvider : JSON.stringify(this.xPaymentProvider)},`;
    }
    if(this.xPaymentMethod !== undefined) {
      json += `"x-payment-method": ${typeof this.xPaymentMethod === 'number' || typeof this.xPaymentMethod === 'boolean' ? this.xPaymentMethod : JSON.stringify(this.xPaymentMethod)},`;
    }
    if(this.xRiskScore !== undefined) {
      json += `"x-risk-score": ${typeof this.xRiskScore === 'number' || typeof this.xRiskScore === 'boolean' ? this.xRiskScore : JSON.stringify(this.xRiskScore)},`;
    }
    if(this.xProcessorTransactionId !== undefined) {
      json += `"x-processor-transaction-id": ${typeof this.xProcessorTransactionId === 'number' || typeof this.xProcessorTransactionId === 'boolean' ? this.xProcessorTransactionId : JSON.stringify(this.xProcessorTransactionId)},`;
    }
    if(this.xRetryCount !== undefined) {
      json += `"x-retry-count": ${typeof this.xRetryCount === 'number' || typeof this.xRetryCount === 'boolean' ? this.xRetryCount : JSON.stringify(this.xRetryCount)},`;
    }
    if(this.xIdempotencyKey !== undefined) {
      json += `"x-idempotency-key": ${typeof this.xIdempotencyKey === 'number' || typeof this.xIdempotencyKey === 'boolean' ? this.xIdempotencyKey : JSON.stringify(this.xIdempotencyKey)},`;
    }
    if(this.xWebhookSignature !== undefined) {
      json += `"x-webhook-signature": ${typeof this.xWebhookSignature === 'number' || typeof this.xWebhookSignature === 'boolean' ? this.xWebhookSignature : JSON.stringify(this.xWebhookSignature)},`;
    }
    if(this.xIpAddress !== undefined) {
      json += `"x-ip-address": ${typeof this.xIpAddress === 'number' || typeof this.xIpAddress === 'boolean' ? this.xIpAddress : JSON.stringify(this.xIpAddress)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-correlation-id","x-tenant-id","x-timestamp","x-payment-provider","x-payment-method","x-risk-score","x-processor-transaction-id","x-retry-count","x-idempotency-key","x-webhook-signature","x-ip-address","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PaymentProcessedHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PaymentProcessedHeaders({} as any);

    if (obj["x-correlation-id"] !== undefined) {
      instance.xCorrelationId = obj["x-correlation-id"];
    }
    if (obj["x-tenant-id"] !== undefined) {
      instance.xTenantId = obj["x-tenant-id"];
    }
    if (obj["x-timestamp"] !== undefined) {
      instance.xTimestamp = obj["x-timestamp"];
    }
    if (obj["x-payment-provider"] !== undefined) {
      instance.xPaymentProvider = obj["x-payment-provider"];
    }
    if (obj["x-payment-method"] !== undefined) {
      instance.xPaymentMethod = obj["x-payment-method"];
    }
    if (obj["x-risk-score"] !== undefined) {
      instance.xRiskScore = obj["x-risk-score"];
    }
    if (obj["x-processor-transaction-id"] !== undefined) {
      instance.xProcessorTransactionId = obj["x-processor-transaction-id"];
    }
    if (obj["x-retry-count"] !== undefined) {
      instance.xRetryCount = obj["x-retry-count"];
    }
    if (obj["x-idempotency-key"] !== undefined) {
      instance.xIdempotencyKey = obj["x-idempotency-key"];
    }
    if (obj["x-webhook-signature"] !== undefined) {
      instance.xWebhookSignature = obj["x-webhook-signature"];
    }
    if (obj["x-ip-address"] !== undefined) {
      instance.xIpAddress = obj["x-ip-address"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-correlation-id","x-tenant-id","x-timestamp","x-payment-provider","x-payment-method","x-risk-score","x-processor-transaction-id","x-retry-count","x-idempotency-key","x-webhook-signature","x-ip-address","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","allOf":[{"type":"object","required":["x-correlation-id","x-tenant-id"],"properties":{"x-correlation-id":{"type":"string","format":"uuid","description":"Unique correlation ID for request tracing"},"x-tenant-id":{"type":"string","description":"Multi-tenant identifier"},"x-timestamp":{"type":"string","format":"date-time","description":"Event creation timestamp"}}},{"type":"object","required":["x-payment-provider"],"properties":{"x-payment-provider":{"type":"string","enum":["stripe","paypal","square","adyen"],"description":"Payment processor used"},"x-payment-method":{"type":"string","enum":["credit-card","debit-card","bank-transfer","digital-wallet"],"description":"Payment method used"},"x-risk-score":{"type":"number","minimum":0,"maximum":100,"description":"Fraud risk score (0-100)"},"x-processor-transaction-id":{"type":"string","description":"Transaction ID from payment processor"},"x-retry-count":{"type":"integer","minimum":0,"maximum":5,"default":0,"description":"Number of retry attempts"},"x-idempotency-key":{"type":"string","format":"uuid","description":"Ensures payment processing idempotency"}}},{"type":"object","properties":{"x-webhook-signature":{"type":"string","description":"Webhook signature for verification"},"x-ip-address":{"type":"string","format":"ipv4","description":"IP address"}}}],"$id":"PaymentProcessedHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { PaymentProcessedHeaders };