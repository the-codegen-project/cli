---
slug: asyncapi-headers-generator
title: AsyncAPI - Type-Safe Headers
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, headers, typescript, messaging, automation]
---

Building robust event-driven applications requires more than just payload validation - you need proper header management for authentication, tracing, routing, and metadata. In our [previous post about payload generation](../asyncapi-payload-generator), we showed how to generate type-safe data models. Now let's explore how The Codegen Project's headers generator can streamline your messaging infrastructure by handling the metadata side of your messages.

<!-- truncate -->

## The Problem: Manual Header Management

When building event-driven systems, message headers are crucial for:

1. **Authentication & Authorization** - JWT tokens, API keys, permission levels
2. **Distributed Tracing** - Correlation IDs, request IDs, timestamps
3. **Message Routing** - Tenant IDs, event types, priorities
4. **Metadata Management** - Actor information, reason codes, audit trails
5. **Performance Optimization** - Retry counts, idempotency keys, batch operations

Managing these headers manually leads to:
- Inconsistent header structures across services
- Runtime errors from missing or malformed headers
- Difficulty maintaining header schemas as systems evolve
- Lack of type safety when accessing header values

## The Solution: Generated Header Models + Custom Infrastructure

The Codegen Project's `headers` preset generates type-safe TypeScript classes for your message headers, leaving you free to implement your messaging infrastructure however you prefer - whether that's NATS, Kafka, RabbitMQ, or HTTP APIs.

## Real-World Example: E-commerce Messaging System

Let's build header models for a comprehensive e-commerce messaging system. Here's our AsyncAPI specification (`ecommerce-messaging-system.yaml`):

> 💡 **Complete Example**: You can find the full working example, including all files mentioned in this post, in our [ecommerce-headers example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-headers).

<details>
<summary>Show me the AsyncAPI document!</summary>
<p>


```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Messaging System
  version: 1.0.0
  description: Event-driven e-commerce system with comprehensive header management for authentication, tracing, routing, and metadata

channels:
  order-events:
    messages:
      OrderCreated:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/AuthHeaders'
            - $ref: '#/components/schemas/ServiceHeaders'
            - type: object
              required: [x-user-id]
              properties:
                x-user-id:
                  type: string
                  format: uuid
                  description: ID of the user who created the order
        payload:
          $ref: '#/components/schemas/OrderCreatedPayload'

      OrderStatusChanged:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/ActorHeaders'
            - type: object
              required: [x-event-type]
              properties:
                x-event-type:
                  $ref: '#/components/schemas/OrderEventType'
                x-previous-status:
                  $ref: '#/components/schemas/OrderStatus'
                x-reason-code:
                  $ref: '#/components/schemas/OrderReasonCode'
                x-priority:
                  $ref: '#/components/schemas/Priority'
        payload:
          $ref: '#/components/schemas/OrderStatusChangedPayload'

  payment-events:
    messages:
      PaymentProcessed:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/PaymentHeaders'
            - $ref: '#/components/schemas/SecurityHeaders'
        payload:
          $ref: '#/components/schemas/PaymentProcessedPayload'

  inventory-events:
    messages:
      InventoryUpdated:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/InventoryHeaders'
            - $ref: '#/components/schemas/AuditHeaders'
        payload:
          $ref: '#/components/schemas/InventoryUpdatedPayload'

  notification-events:
    messages:
      NotificationSent:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/NotificationHeaders'
            - $ref: '#/components/schemas/LocalizationHeaders'
        payload:
          $ref: '#/components/schemas/NotificationSentPayload'

  analytics-events:
    messages:
      UserBehaviorTracked:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/SessionHeaders'
            - $ref: '#/components/schemas/DeviceHeaders'
            - $ref: '#/components/schemas/PrivacyHeaders'
        payload:
          $ref: '#/components/schemas/UserBehaviorTrackedPayload'

  admin-events:
    messages:
      AdminActionPerformed:
        headers:
          allOf:
            - $ref: '#/components/schemas/CommonHeaders'
            - $ref: '#/components/schemas/AdminHeaders'
            - $ref: '#/components/schemas/SecurityHeaders'
            - $ref: '#/components/schemas/ComplianceHeaders'
        payload:
          $ref: '#/components/schemas/AdminActionPerformedPayload'

components:
  schemas:
    # Base header schemas
    CommonHeaders:
      type: object
      required: [x-correlation-id, x-tenant-id]
      properties:
        x-correlation-id:
          type: string
          format: uuid
          description: Unique correlation ID for request tracing
        x-tenant-id:
          type: string
          description: Multi-tenant identifier
        x-timestamp:
          type: string
          format: date-time
          description: Event creation timestamp

    AuthHeaders:
      type: object
      properties:
        authorization:
          type: string
          pattern: '^Bearer [A-Za-z0-9\-\._~\+\/]+=*$'
          description: JWT token for authentication

    ServiceHeaders:
      type: object
      properties:
        x-source-service:
          $ref: '#/components/schemas/SourceService'
        x-api-version:
          type: string
          pattern: '^v[0-9]+$'
          description: API version used
          default: v1
        x-request-id:
          type: string
          format: uuid
          description: Original request ID from the client

    ActorHeaders:
      type: object
      properties:
        x-actor-id:
          type: string
          format: uuid
          description: ID of user/system that triggered the change
        x-actor-type:
          $ref: '#/components/schemas/ActorType'

    PaymentHeaders:
      type: object
      required: [x-payment-provider]
      properties:
        x-payment-provider:
          $ref: '#/components/schemas/PaymentProvider'
        x-payment-method:
          $ref: '#/components/schemas/PaymentMethod'
        x-risk-score:
          type: number
          minimum: 0
          maximum: 100
          description: Fraud risk score (0-100)
        x-processor-transaction-id:
          type: string
          description: Transaction ID from payment processor
        x-retry-count:
          type: integer
          minimum: 0
          maximum: 5
          default: 0
          description: Number of retry attempts
        x-idempotency-key:
          type: string
          format: uuid
          description: Ensures payment processing idempotency

    SecurityHeaders:
      type: object
      properties:
        x-webhook-signature:
          type: string
          description: Webhook signature for verification
        x-ip-address:
          type: string
          format: ipv4
          description: IP address

    InventoryHeaders:
      type: object
      required: [x-warehouse-id]
      properties:
        x-warehouse-id:
          type: string
          description: Warehouse where inventory changed
        x-update-type:
          $ref: '#/components/schemas/InventoryUpdateType'
        x-batch-id:
          type: string
          format: uuid
          description: Batch ID for bulk operations
        x-location:
          type: string
          description: Specific location within warehouse

    AuditHeaders:
      type: object
      properties:
        x-operator-id:
          type: string
          format: uuid
          description: ID of person/system making the change
        x-audit-required:
          type: boolean
          default: false
          description: Whether this change requires audit

    NotificationHeaders:
      type: object
      required: [x-notification-type]
      properties:
        x-notification-type:
          $ref: '#/components/schemas/NotificationType'
        x-template-id:
          type: string
          description: Template used for notification
        x-channel-preference:
          $ref: '#/components/schemas/NotificationChannel'
        x-delivery-attempt:
          type: integer
          minimum: 1
          maximum: 3
          default: 1
          description: Delivery attempt number
        x-scheduled-time:
          type: string
          format: date-time
          description: When notification was scheduled to be sent
        x-provider:
          $ref: '#/components/schemas/NotificationProvider'

    LocalizationHeaders:
      type: object
      properties:
        x-language:
          type: string
          pattern: '^[a-z]{2}(-[A-Z]{2})?$'
          description: Language code (e.g., en-US, fr-FR)
          default: en-US

    SessionHeaders:
      type: object
      required: [x-session-id]
      properties:
        x-session-id:
          type: string
          format: uuid
          description: User session identifier

    DeviceHeaders:
      type: object
      properties:
        x-user-agent:
          type: string
          description: Browser/app user agent string
        x-device-type:
          $ref: '#/components/schemas/DeviceType'
        x-platform:
          $ref: '#/components/schemas/Platform'

    PrivacyHeaders:
      type: object
      properties:
        x-ab-test-groups:
          type: array
          items:
            type: string
          description: A/B test groups user belongs to
        x-feature-flags:
          type: array
          items:
            type: string
          description: Active feature flags for user
        x-gdpr-consent:
          type: boolean
          description: Whether user has given GDPR consent
        x-data-retention-days:
          type: integer
          minimum: 1
          maximum: 2555
          default: 365
          description: How long to retain this data

    AdminHeaders:
      type: object
      required: [x-admin-id, x-action-type]
      properties:
        x-admin-id:
          type: string
          format: uuid
          description: ID of admin performing action
        x-action-type:
          $ref: '#/components/schemas/AdminActionType'
        x-permission-level:
          $ref: '#/components/schemas/PermissionLevel'
        x-audit-level:
          $ref: '#/components/schemas/AuditLevel'
        x-approval-required:
          type: boolean
          default: false
          description: Whether action requires approval
        x-approved-by:
          type: string
          format: uuid
          description: ID of approving admin (if applicable)

    ComplianceHeaders:
      type: object
      properties:
        x-compliance-tags:
          type: array
          items:
            type: string
          description: Compliance/regulatory tags

    # Enum schemas
    SourceService:
      type: string
      enum: [web-app, mobile-app, admin-panel]
      description: Service that originated the event

    ActorType:
      type: string
      enum: [user, system, admin]
      description: Type of actor that triggered the change

    OrderEventType:
      type: string
      enum: [status-change, cancellation, refund]
      description: Type of status change event

    OrderStatus:
      type: string
      enum: [pending, confirmed, processing, shipped, delivered, cancelled]
      description: Order status values

    OrderReasonCode:
      type: string
      enum: [customer-request, payment-failed, inventory-unavailable, fraud-detected]
      description: Reason code for status change

    Priority:
      type: string
      enum: [low, normal, high, urgent]
      default: normal
      description: Processing priority

    PaymentProvider:
      type: string
      enum: [stripe, paypal, square, adyen]
      description: Payment processor used

    PaymentMethod:
      type: string
      enum: [credit-card, debit-card, bank-transfer, digital-wallet]
      description: Payment method used

    InventoryUpdateType:
      type: string
      enum: [restock, sale, adjustment, damage, return]
      description: Type of inventory update

    NotificationType:
      type: string
      enum: [email, sms, push, webhook]
      description: Type of notification sent

    NotificationChannel:
      type: string
      enum: [email, sms, push, none]
      description: User's preferred notification channel

    NotificationProvider:
      type: string
      enum: [sendgrid, twilio, firebase, custom]
      description: Notification service provider

    DeviceType:
      type: string
      enum: [desktop, mobile, tablet, tv, watch]
      description: Type of device used

    Platform:
      type: string
      enum: [web, ios, android, api]
      description: Platform/app used

    AdminActionType:
      type: string
      enum: [user-management, order-management, inventory-management, system-config]
      description: Category of admin action

    PermissionLevel:
      type: string
      enum: [read, write, admin, super-admin]
      description: Permission level required for action

    AuditLevel:
      type: string
      enum: [low, medium, high, critical]
      description: Audit importance level

    # Payload schemas
    OrderCreatedPayload:
      type: object
      properties:
        orderId:
          type: string
        customerId:
          type: string
        totalAmount:
          type: number

    OrderStatusChangedPayload:
      type: object
      properties:
        orderId:
          type: string
        newStatus:
          type: string
        timestamp:
          type: string

    PaymentProcessedPayload:
      type: object
      properties:
        paymentId:
          type: string
        orderId:
          type: string
        amount:
          type: number
        status:
          type: string

    InventoryUpdatedPayload:
      type: object
      properties:
        productId:
          type: string
        quantityChange:
          type: integer
        newQuantity:
          type: integer

    NotificationSentPayload:
      type: object
      properties:
        recipientId:
          type: string
        message:
          type: string
        status:
          type: string

    UserBehaviorTrackedPayload:
      type: object
      properties:
        userId:
          type: string
        action:
          type: string
        timestamp:
          type: string

    AdminActionPerformedPayload:
      type: object
      properties:
        action:
          type: string
        targetId:
          type: string
        details:
          type: object 
```

</p>
</details>

## Generating the Header Models

Create a configuration file to generate TypeScript header models:

```js
// codegen.config.js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-messaging-system.yaml',
  generators: [
    {
      preset: 'headers',
      outputPath: './src/generated/headers',
      language: 'typescript',
    }
  ]
};
```

> 📁 **See the complete configuration**: [codegen.config.js](https://github.com/the-codegen-project/cli/blob/main/examples/ecommerce-headers/codegen.config.js)

Run the generator:

```bash
npx @the-codegen-project/cli generate codegen.config.js
```

This generates TypeScript classes with built-in serialization for each message's headers:

```typescript
// Generated: src/generated/headers/OrderCreatedHeaders.ts
export class OrderCreatedHeaders {
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

  // Getters and setters...
  get xCorrelationId(): string { return this._xCorrelationId; }
  get xUserId(): string { return this._xUserId; }
  get xTenantId(): string { return this._xTenantId; }
  // ... more getters

  // JSON serialization
  public marshal(): string {
    // Generated marshalling logic
  }

  // JSON deserialization
  public static unmarshal(json: string | object): OrderCreatedHeaders {
    // Generated un-marshalling logic
  }

  // Validation methods
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    // Generated AJV validation logic
  }

  public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
    // Returns reusable validator function
  }
}
```

## Using Generated Header Models in Your Infrastructure

Now you can use these generated header models with any messaging infrastructure:

### With NATS

```typescript
import { connect } from 'nats';
import { OrderCreatedHeaders } from './generated/headers/OrderCreatedHeaders';
import { PaymentProcessedHeaders } from './generated/headers/PaymentProcessedHeaders';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Publishing with type-safe headers
async function publishOrderCreated(payload: any, headers: OrderCreatedHeaders) {
  await nc.publish('orders.created', JSON.stringify(payload), {
    headers: JSON.parse(headers.marshal())
  });
}

// Consuming with header validation
const sub = nc.subscribe('payments.processed');
for await (const msg of sub) {
  try {
    const headers = PaymentProcessedHeaders.unmarshal(msg.headers);
    
    // Validate required headers
    if (!headers.xCorrelationId || !headers.xPaymentProvider) {
      console.error('Missing required headers');
      continue;
    }
    
    // Route based on payment provider
    switch (headers.xPaymentProvider) {
      case 'stripe':
        await processStripePayment(msg.data, headers);
        break;
      case 'paypal':
        await processPayPalPayment(msg.data, headers);
        break;
    }
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}
```

### With Kafka

```typescript
import { Kafka } from 'kafkajs';
import { PaymentProcessedHeaders } from './generated/headers/PaymentProcessedHeaders';

const kafka = new Kafka({ clientId: 'payment-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function publishPaymentProcessed(payment: any, headers: PaymentProcessedHeaders) {
  await producer.send({
    topic: 'payments.processed',
    messages: [{
      key: payment.paymentId,
      value: JSON.stringify(payment),
      headers: JSON.parse(headers.marshal())
    }]
  });
}

// Consumer with header-based routing
const consumer = kafka.consumer({ groupId: 'payment-processor' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const headers = PaymentProcessedHeaders.unmarshal(message.headers);
    
    // Use risk score for processing decisions
    if (headers.xRiskScore && headers.xRiskScore > 50) {
      await flagForManualReview(message.value, headers);
    } else {
      await processAutomatically(message.value, headers);
    }
  }
});
```

## Advanced Header Patterns

### Multi-tenant Routing

```typescript
import { OrderCreatedHeaders } from './generated/headers/OrderCreatedHeaders';

// Route messages based on tenant
function routeByTenant(headers: OrderCreatedHeaders) {
  const tenantConfig = getTenantConfig(headers.xTenantId);
  
  return {
    topic: `orders.created.${tenantConfig.region}`,
    partition: tenantConfig.partition,
    headers: headers.marshal()
  };
}
```

### Distributed Tracing

```typescript
import { PaymentProcessedHeaders } from './generated/headers/PaymentProcessedHeaders';

// Link events across services
async function processPayment(paymentData: any, incomingHeaders: OrderCreatedHeaders) {
  const paymentHeaders = new PaymentProcessedHeaders({
    xCorrelationId: incomingHeaders.xCorrelationId, // Preserve correlation
    xPaymentProvider: 'stripe',
    xTenantId: incomingHeaders.xTenantId,
    xIdempotencyKey: generateIdempotencyKey(),
    xRetryCount: 0
  });
  
  // Process payment with linked tracing
  await publishPaymentEvent(paymentData, paymentHeaders);
}
```

### Authentication & Security

```typescript
import { AdminActionPerformedHeaders } from './generated/headers/AdminActionPerformedHeaders';

// Validate JWT and extract claims
function validateAdminHeaders(headers: AdminActionPerformedHeaders): boolean {
  // Verify JWT token structure
  if (!headers.authorization?.startsWith('Bearer ')) {
    return false;
  }
  
  // Check permission level matches action type
  const requiredLevel = getRequiredPermissionLevel(headers.xActionType);
  return hasPermission(headers.xPermissionLevel, requiredLevel);
}
```

### Performance Optimization

```typescript
import { NotificationSentHeaders } from './generated/headers/NotificationSentHeaders';

// Batch notifications by provider
const notificationBatches = new Map<string, NotificationSentHeaders[]>();

function batchNotification(headers: NotificationSentHeaders) {
  const provider = headers.xProvider || 'default';
  
  if (!notificationBatches.has(provider)) {
    notificationBatches.set(provider, []);
  }
  
  notificationBatches.get(provider)!.push(headers);
  
  // Process batch when full
  if (notificationBatches.get(provider)!.length >= 100) {
    processBatch(provider, notificationBatches.get(provider)!);
    notificationBatches.set(provider, []);
  }
}
```

## Error Handling and Validation

The generated header models include robust validation capabilities that help catch errors before they propagate through your system:

```typescript
import { OrderCreatedHeaders } from './generated/headers/OrderCreatedHeaders';

// Validate raw header data before creating model instances
function validateAndCreateOrderHeaders(rawHeaders: any): OrderCreatedHeaders | null {
  // First, validate the raw data structure
  const validation = OrderCreatedHeaders.validate({
    data: rawHeaders
  });
  
  if (!validation.valid) {
    console.error('Header validation failed:', validation.errors);
    return null;
  }
  // If validation passes, safely create the header instance
  const headers = OrderCreatedHeaders.unmarshal(rawHeaders);
  return headers;
}
```

## Benefits of This Approach

1. **Type Safety**: Full TypeScript support with compile-time checking for headers
2. **Automatic Serialization**: Built-in JSON marshalling/unmarshalling
3. **Header Validation**: Ensure required headers are present and correctly formatted
4. **Infrastructure Freedom**: Use any messaging system or HTTP framework
5. **Maintainability**: Schema changes automatically update your header models
6. **Performance**: Optimized validation for high-throughput systems

## Conclusion

By generating header models from your AsyncAPI specification, you eliminate manual header management while gaining type safety and consistency across your entire messaging infrastructure. This approach gives you robust, maintainable code that handles authentication, tracing, routing, and metadata seamlessly.

The generated header models integrate with any messaging system and provide the foundation for building scalable, observable, and secure event-driven applications. Combined with automatic serialization and validation, you get production-ready header management that evolves with your API specifications.

Ready to try it yourself? Check out the [headers generator documentation](/docs/generators/headers) and start generating your header models today! 

## Try It Yourself

Want to see this in action? Clone our [ecommerce-headers example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-headers) and run:

```bash
cd examples/ecommerce-headers
npm install
npm run generate
npm run demo
```

This will generate the header models and run a comprehensive demonstration showing how they work with authentication, tracing, routing, and metadata management across different messaging patterns. 

## Additional Resources

- **[Headers Generator Documentation](/docs/generators/headers)** - Complete guide to header generation options and configuration
- **[AsyncAPI Input Documentation](/docs/inputs/asyncapi)** - Understanding AsyncAPI specifications for code generation
- **[E-commerce Headers Example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-headers)** - Complete working example from this blog post
- **[NATS Protocol](/docs/protocols/nats)** - Using generated headers with NATS messaging
- **[Kafka Protocol](/docs/protocols/kafka)** - Using generated headers with Apache Kafka
- **[HTTP Protocol](/docs/protocols/http)** - Using generated headers with HTTP APIs
