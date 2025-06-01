---
slug: asyncapi-payload-generator
title: AsyncAPI - Stop wasting time on payloads
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

The first three are pure boilerplate that can be generated. The fourth is where your business value lies and is where you should spend the most time.

## The Solution: Generated Models + Custom Infrastructure

The Codegen Project's `payloads` preset generates only the payload representation, leaving you free to implement infrastructure however you prefer - whether that's using NATS, Kafka, RabbitMQ, or any other messaging system.

## Real-World Example: E-commerce Order System

Let's take a real world example, an e-commerce order processing system. Here's our AsyncAPI specification (`ecommerce-order-system.yaml`):

> 💡 **Complete Example**: You can find the full working example, including all files mentioned in this post, in our [ecommerce-payloads example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-payloads).

<details>
<summary>Show me the AsyncAPI document!</summary>
<p>

```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Order System
  version: 1.0.0
  description: Event-driven order processing system

channels:
  order-events:
    # ...
    messages:
      OrderCreated:
        payload:
          $ref: '#/components/schemas/OrderCreated'

      OrderStatusChanged:
        payload:
          $ref: '#/components/schemas/OrderStatusChanged'

  payment-events:
    # ...
    messages:
      PaymentProcessed:
        payload:
          $ref: '#/components/schemas/PaymentProcessed'

  notification-events:
    # ...
    messages:
      # Edge case: Union types for different notification channels
      NotificationSent:
        payload:
          $ref: '#/components/schemas/NotificationSent'

components:
  schemas:
    OrderCreated:
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
            $ref: '#/components/schemas/OrderItem'
        totalAmount:
          type: number
          minimum: 0
          description: Total order amount in cents
        currency:
          $ref: '#/components/schemas/Currency'
        shippingAddress:
          $ref: '#/components/schemas/Address'
        metadata:
          $ref: '#/components/schemas/Metadata'

    OrderItem:
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
          $ref: '#/components/schemas/Metadata'

    OrderStatusChanged:
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

    PaymentProcessed:
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
          $ref: '#/components/schemas/Currency'
        status:
          $ref: '#/components/schemas/PaymentStatus'
        processorResponse:
          $ref: '#/components/schemas/Metadata'

    NotificationSent:
      oneOf:
        - $ref: '#/components/schemas/EmailNotification'
        - $ref: '#/components/schemas/SmsNotification'
        - $ref: '#/components/schemas/PushNotification'
      discriminator: 'type'

    EmailNotification:
      type: object
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
            $ref: '#/components/schemas/Attachment'

    SmsNotification:
      type: object
      required: [type, recipientId, message]
      properties:
        type:
          const: sms
        recipientId:
          type: string
        message:
          type: string
          maxLength: 160

    PushNotification:
      type: object
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

    Attachment:
      type: object
      properties:
        filename:
          type: string
        contentType:
          type: string
        data:
          type: string
          contentEncoding: base64

    Currency:
      type: string
      enum: [USD, EUR, GBP]
      description: Currency code

    PaymentStatus:
      type: string
      enum: [success, failed, pending]
      description: Payment processing status

    Metadata:
      type: object
      additionalProperties: true
      description: Additional metadata

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

    # Edge case: Circular reference example
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

</p>
</details>
## Generating the Models

[Create a configuration file](/docs/configurations) to generate TypeScript payload models:

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

> 📁 **See the complete configuration**: [codegen.config.js](https://github.com/the-codegen-project/cli/blob/main/examples/ecommerce-asyncapi-payloads/codegen.config.js)

Run the generator:

```bash
npx @the-codegen-project/cli generate codegen.config.js
```

This generates TypeScript classes with built-in validation for each message type:

```typescript
// Generated: src/generated/models/OrderCreated.ts
export class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: number;
  private _currency: Currency;
  private _shippingAddress?: Address;
  private _metadata?: Record<string, any>;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    orderId: string,
    customerId: string,
    items: OrderItem[],
    totalAmount: number,
    currency: Currency,
    shippingAddress?: Address,
    metadata?: Record<string, any>,
    additionalProperties?: Record<string, any>,
  }) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    this._currency = input.currency;
    this._shippingAddress = input.shippingAddress;
    this._metadata = input.metadata;
    this._additionalProperties = input.additionalProperties;
  }

  // Getters and setters...
  get orderId(): string { return this._orderId; }
  get customerId(): string { return this._customerId; }
  // ... more getters

  // JSON serialization
  public marshal(): string {
    // Generated marshalling logic
  }

  // JSON deserialization
  public static unmarshal(json: string | object): OrderCreated {
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

## Using Generated Models in Your Infrastructure

Now you can use these generated models with any messaging infrastructure:

### With NATS

```typescript
import { connect } from 'nats';
import { OrderCreated, PaymentProcessed } from './generated/models';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Publishing with type safety
async function publishOrderCreated(order: OrderCreated) {
  const jsonString = order.marshal();
  const validation = OrderCreated.validate({data: jsonString});
  if (!validation.valid) {
    throw new Error(`Invalid order data: ${validation.errors}`);
  }
  
  await nc.publish('orders.created', jsonString);
}

// Consuming with validation
const sub = nc.subscribe('payments.processed');
for await (const msg of sub) {
  try {
    const data = msg.data.toString();
    const validation = PaymentProcessed.validate({data});
    
    if (!validation.valid) {
      console.error('Invalid payment data:', validation.errors);
      continue;
    }
    
    const payment = PaymentProcessed.unmarshal(data);
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
  const jsonString = statusChange.marshal();
  const validation = OrderStatusChanged.validate({data: jsonString});
  if (!validation.valid) {
    throw new Error(`Invalid status change: ${validation.errors}`);
  }

  await producer.send({
    topic: 'order-status-changes',
    messages: [{
      key: statusChange.orderId,
      value: jsonString
    }]
  });
}
```

## Handling Edge Cases

### Union Types and Polymorphism

The generated `NotificationSent` model handles the union type elegantly:

```typescript
import { 
  EmailNotification, 
  SmsNotification, 
  PushNotification,
  NotificationSent
} from './generated/models';

function process(data: any) {
  // Validate it generically
  if (!NotificationSent.validate({data}).valid) {
    throw new Error('Not a valid notification object');
  }
  const notificationData = NotificationSent.unmarshal(data);

  if(notificationData instanceof EmailNotification){
    // Do something with email notification data
    return sendEmail(notification);
  } else if(notificationData instanceof SmsNotification){
    // Do something with sms notification data
    return sendSms(notification);
  } else if(notificationData instanceof PushNotification){
    // Do something with push notification data
    return sendPushNotification(notification);
  }

  // Or do it for each variant
  if (EmailNotification.validate({data}).valid) {
    const notification = NotificationSentEmail.unmarshal(data);
    return sendEmail(notification);
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
    new OrderItem({
      productId: 'LAPTOP-001',
      quantity: 1,
      unitPrice: 249900
    }),
    new OrderItem({
      productId: 'MOUSE-001',
      quantity: 2,
      unitPrice: 7900
    })
  ],
  totalAmount: 99999,
  currency: Currency.USD,
  shippingAddress: new Address({
    street: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US'
  })
});
```

### Circular References

The generator can of course handle circular references in schemas:

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

## Validation Performance Optimization

For high-throughput scenarios, create validators once and reuse them:

```typescript
// Create validators at startup
const orderCreatedValidator = OrderCreated.createValidator();

// Reuse in message processing
function processOrderMessage(data: any) {
  const validation = OrderCreated.validate({ 
    data, 
    ajvValidatorFunction: orderCreatedValidator 
  });
  
  if (!validation.valid) {
    throw new Error(`Invalid order: ${validation.errors}`);
  }
  
  return OrderCreated.unmarshal(data);
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

Ready to try it yourself? Check out the [payload generator documentation](/docs/generators/payloads) and start generating your models today! 

## Try It Yourself

Want to see this in action? Clone our [ecommerce-payloads example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-payloads) and run:

```bash
cd examples/ecommerce-asyncapi-payloads
npm install
npm run generate
npm run demo
```

This will generate the payload models and run a demonstration showing how they work with validation and serialization.

## Additional Resources

- **[Payload Generator Documentation](/docs/generators/payloads)** - Complete guide to payload generation options and configuration
- **[E-commerce Payloads Example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-payloads)** - Complete working example from this blog post
- **[All Examples Repository](https://github.com/the-codegen-project/cli/tree/main/examples)** - Browse all available examples and use cases
