---
slug: payload-models-generation
title: Generate Payload Models Alongside Your Code - Stop Wasting Time on Boilerplate
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, payloads, typescript, automation]
---

Building event-driven applications often means spending countless hours writing and maintaining payload models. What if you could generate these models automatically from your AsyncAPI specification while keeping full control over your infrastructure code? In this post, we'll explore how The Codegen Project's payload generator can save you time and reduce errors.

<!-- truncate -->

## The Problem: Manual Model Maintenance

When building event-driven systems, you typically need:

1. **Payload models** - TypeScript interfaces/classes representing your message structures
2. **Validation logic** - Ensuring incoming data matches expected schemas  
3. **Serialization/deserialization** - Converting between JSON and typed objects
4. **Infrastructure code** - Your custom message handling, routing, and business logic

The first three are pure boilerplate that can be generated. The fourth is where your business value lies and should remain under your control.

## The Solution: Generated Models + Custom Infrastructure

The Codegen Project's `payloads` preset generates only the data models, leaving you free to implement infrastructure however you prefer - whether that's using NATS, Kafka, RabbitMQ, or any other messaging system.

## Real-World Example: E-commerce Order System

Let's build payload models for an e-commerce order processing system. Here's our AsyncAPI specification (`ecommerce-order-system.yaml`):

```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Order System
  version: 1.0.0
  description: Event-driven order processing system

channels:
  order-events:
    messages:
      OrderCreated:
        payload:
          type: object
          required: [orderId, customerId, items, totalAmount, currency]
          properties:
            orderId:
              type: string
              format: uuid
              description: Unique order identifier
            customerId:
              type: string
              format: uuid
              description: Customer who placed the order
            items:
              type: array
              items:
                type: object
                required: [productId, quantity, unitPrice]
                properties:
                  productId:
                    type: string
                    description: Product identifier
                  quantity:
                    type: integer
                    minimum: 1
                    description: Number of items ordered
                  unitPrice:
                    type: number
                    minimum: 0
                    description: Price per unit in cents
                  metadata:
                    type: object
                    additionalProperties: true
                    description: Additional product metadata
            totalAmount:
              type: number
              minimum: 0
              description: Total order amount in cents
            currency:
              type: string
              enum: [USD, EUR, GBP]
              description: Order currency
            shippingAddress:
              $ref: '#/components/schemas/Address'
            metadata:
              type: object
              additionalProperties: true
              description: Additional order metadata

      OrderStatusChanged:
        payload:
          type: object
          required: [orderId, previousStatus, newStatus, timestamp]
          properties:
            orderId:
              type: string
              format: uuid
            previousStatus:
              $ref: '#/components/schemas/OrderStatus'
            newStatus:
              $ref: '#/components/schemas/OrderStatus'
            timestamp:
              type: string
              format: date-time
            reason:
              type: string
              description: Reason for status change

  payment-events:
    messages:
      PaymentProcessed:
        payload:
          type: object
          required: [paymentId, orderId, amount, currency, status]
          properties:
            paymentId:
              type: string
              format: uuid
            orderId:
              type: string
              format: uuid
            amount:
              type: number
              minimum: 0
            currency:
              type: string
              enum: [USD, EUR, GBP]
            status:
              type: string
              enum: [success, failed, pending]
            processorResponse:
              type: object
              additionalProperties: true
              description: Raw response from payment processor

  notification-events:
    messages:
      # Edge case: Union types for different notification channels
      NotificationSent:
        payload:
          oneOf:
            - type: object
              required: [type, recipientId, subject, body]
              properties:
                type:
                  const: email
                recipientId:
                  type: string
                subject:
                  type: string
                body:
                  type: string
                attachments:
                  type: array
                  items:
                    type: object
                    properties:
                      filename:
                        type: string
                      contentType:
                        type: string
                      data:
                        type: string
                        format: base64
            - type: object
              required: [type, recipientId, message]
              properties:
                type:
                  const: sms
                recipientId:
                  type: string
                message:
                  type: string
                  maxLength: 160
            - type: object
              required: [type, recipientId, title, body]
              properties:
                type:
                  const: push
                recipientId:
                  type: string
                title:
                  type: string
                body:
                  type: string
                badge:
                  type: integer
                  minimum: 0

components:
  schemas:
    Address:
      type: object
      required: [street, city, country, postalCode]
      properties:
        street:
          type: string
        city:
          type: string
        state:
          type: string
        country:
          type: string
          minLength: 2
          maxLength: 2
          description: ISO 3166-1 alpha-2 country code
        postalCode:
          type: string

    OrderStatus:
      type: string
      enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
```

## Generating the Models

Create a configuration file to generate TypeScript payload models:

```js
// codegen.config.js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-order-system.yaml',
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/generated/models',
      language: 'typescript',
      includeValidation: true
    }
  ]
};
```

Run the generator:

```bash
npx @the-codegen-project/cli generate
```

This generates TypeScript classes with built-in validation for each message type:

```typescript
// Generated: src/generated/models/OrderCreated.ts
export class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderCreatedItems[];
  private _totalAmount: number;
  private _currency: OrderCreatedCurrency;
  private _shippingAddress?: Address;
  private _metadata?: { [key: string]: any };

  constructor(input: {
    orderId: string,
    customerId: string,
    items: OrderCreatedItems[],
    totalAmount: number,
    currency: OrderCreatedCurrency,
    shippingAddress?: Address,
    metadata?: { [key: string]: any }
  }) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    this._currency = input.currency;
    this._shippingAddress = input.shippingAddress;
    this._metadata = input.metadata;
  }

  // Getters and setters...
  get orderId(): string { return this._orderId; }
  get customerId(): string { return this._customerId; }
  // ... more getters

  // JSON serialization
  toJSON(): any {
    return {
      orderId: this._orderId,
      customerId: this._customerId,
      items: this._items,
      totalAmount: this._totalAmount,
      currency: this._currency,
      shippingAddress: this._shippingAddress,
      metadata: this._metadata
    };
  }

  // Validation methods
  static validate(data: any): { valid: boolean; errors?: any[] } {
    // Generated AJV validation logic
  }

  static createValidator() {
    // Returns reusable validator function
  }
}
```

## Using Generated Models in Your Infrastructure

Now you can use these generated models with any messaging infrastructure:

### With NATS

```typescript
import { connect } from 'nats';
import { OrderCreated, PaymentProcessed } from './generated/models';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Publishing with type safety
async function publishOrderCreated(order: OrderCreated) {
  const validation = OrderCreated.validate(order.toJSON());
  if (!validation.valid) {
    throw new Error(`Invalid order data: ${validation.errors}`);
  }
  
  await nc.publish('orders.created', JSON.stringify(order.toJSON()));
}

// Consuming with validation
const sub = nc.subscribe('payments.processed');
for await (const msg of sub) {
  try {
    const data = JSON.parse(msg.data.toString());
    const validation = PaymentProcessed.validate(data);
    
    if (!validation.valid) {
      console.error('Invalid payment data:', validation.errors);
      continue;
    }
    
    const payment = new PaymentProcessed(data);
    await handlePaymentProcessed(payment);
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}
```

### With Kafka

```typescript
import { Kafka } from 'kafkajs';
import { OrderStatusChanged } from './generated/models';

const kafka = new Kafka({ clientId: 'order-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function publishStatusChange(statusChange: OrderStatusChanged) {
  const validation = OrderStatusChanged.validate(statusChange.toJSON());
  if (!validation.valid) {
    throw new Error(`Invalid status change: ${validation.errors}`);
  }

  await producer.send({
    topic: 'order-status-changes',
    messages: [{
      key: statusChange.orderId,
      value: JSON.stringify(statusChange.toJSON())
    }]
  });
}
```

## Handling Edge Cases

### Union Types and Polymorphism

The generated `NotificationSent` model handles the union type elegantly:

```typescript
// Generated models for each notification type
import { 
  NotificationSentEmail, 
  NotificationSentSms, 
  NotificationSentPush 
} from './generated/models';

function processNotification(data: any) {
  // Try each variant
  if (NotificationSentEmail.validate(data).valid) {
    const notification = new NotificationSentEmail(data);
    return sendEmail(notification);
  }
  
  if (NotificationSentSms.validate(data).valid) {
    const notification = new NotificationSentSms(data);
    return sendSms(notification);
  }
  
  if (NotificationSentPush.validate(data).valid) {
    const notification = new NotificationSentPush(data);
    return sendPushNotification(notification);
  }
  
  throw new Error('Unknown notification type');
}
```

### Complex Nested Objects

The generator handles nested objects and arrays seamlessly:

```typescript
const order = new OrderCreated({
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  customerId: '987fcdeb-51a2-43d1-9f12-345678901234',
  items: [
    {
      productId: 'LAPTOP-001',
      quantity: 1,
      unitPrice: 99999, // $999.99 in cents
      metadata: { color: 'silver', warranty: '2-year' }
    }
  ],
  totalAmount: 99999,
  currency: 'USD',
  shippingAddress: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    postalCode: '94105'
  }
});
```

### Circular References

The generator can handle circular references in schemas:

```yaml
# In your AsyncAPI spec
components:
  schemas:
    Category:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        parentCategory:
          $ref: '#/components/schemas/Category'
        subcategories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
```

## Performance Optimization

For high-throughput scenarios, create validators once and reuse them:

```typescript
// Create validators at startup
const orderCreatedValidator = OrderCreated.createValidator();
const paymentProcessedValidator = PaymentProcessed.createValidator();

// Reuse in message processing
function processOrderMessage(data: any) {
  const validation = OrderCreated.validate({ 
    data, 
    ajvValidatorFunction: orderCreatedValidator 
  });
  
  if (!validation.valid) {
    throw new Error(`Invalid order: ${validation.errors}`);
  }
  
  return new OrderCreated(data);
}
```

## Benefits of This Approach

1. **Type Safety**: Full TypeScript support with compile-time checking
2. **Runtime Validation**: Built-in JSON Schema validation prevents runtime errors
3. **Single Source of Truth**: Your AsyncAPI spec drives both documentation and code
4. **Infrastructure Freedom**: Use any messaging system or framework
5. **Maintainability**: Schema changes automatically update your models
6. **Performance**: Optimized validation with reusable validators

## Conclusion

By generating payload models from your AsyncAPI specification, you eliminate boilerplate code while maintaining full control over your infrastructure. This approach gives you the best of both worlds: automated, type-safe data models and the flexibility to implement your messaging infrastructure exactly how you need it.

The generated models handle complex scenarios like union types, nested objects, and circular references, making them suitable for real-world applications. Combined with built-in validation, you get robust, maintainable code that evolves with your API specifications.

Ready to try it yourself? Check out the [payload generator documentation](https://the-codegen-project.org/docs/generators/payloads) and start generating your models today! 