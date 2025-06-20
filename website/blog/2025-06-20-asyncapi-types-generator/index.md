---
slug: asyncapi-types-generator
title: AsyncAPI - Type safety Never Publish to Wrong Channels Again
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, types, typescript, channels, routing]
---

Building event-driven applications with multiple channels often leads to a common but critical problem: hardcoded channel names scattered throughout your codebase. One typo in a channel name can send events to the wrong destination or create silent failures. We've already explored generating [models for payloads](../asyncapi-payload-generator) and [headers](../asyncapi-headers-generator). Now let's see how The Codegen Project's types generator provides compile-time safety for all your channel routing.

<!-- truncate -->

## The Problem: Channel Name Chaos

In event-driven e-commerce systems, you typically have numerous channels for different business domains:

```typescript
// Without type safety - error-prone hardcoded strings
await publisher.publish('order.created', orderData);
await publisher.publish('order-events', statusUpdate);     // Oops! Wrong format
await publisher.publish('inventory.updated', stockData);   // Different from spec
```

This leads to several problems:

1. **Runtime Failures**: Typos in channel names cause events to be lost
2. **Hard to Refactor**: Changing channel names requires hunting through the entire codebase
3. **No IDE Support**: No autocomplete or compile-time validation for channel names

## The Solution: Generated Channel Types

The Codegen Project's `types` preset generates TypeScript types and utilities that ensure you can only reference channels that actually exist in your AsyncAPI specification.

## Real-World Example: E-commerce Event Routing

Let's build a type-safe channel routing system for an e-commerce platform. Here's our AsyncAPI specification (`ecommerce-channels.yaml`):

> 💡 **Complete Example**: You can find the full working example, including all files mentioned in this post, in our [ecommerce-types example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-types).

<details>
<summary>Show me the AsyncAPI document!</summary>
<p>

```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Event Channels
  version: 1.0.0
  description: Channel definitions for e-commerce event routing

channels:
  order-events:
    address: 'ecommerce.orders.{orderId}'
    description: Order lifecycle events
    parameters:
      orderId:
        description: The order identifier
    messages:
      OrderCreated:
        name: OrderCreated
        title: Order Created
        summary: Fired when a new order is created
        payload:
          type: object
          properties:
            orderId:
              type: string
              format: uuid
            customerId:
              type: string
              format: uuid
            totalAmount:
              type: number
      OrderUpdated:
        name: OrderUpdated
        title: Order Updated
        summary: Fired when order details are modified
        payload:
          type: object
          properties:
            orderId:
              type: string
              format: uuid
            changes:
              type: object

  payment-events:
    address: 'ecommerce.payments.{paymentId}'
    description: Payment processing events
    parameters:
      paymentId:
        description: The payment identifier
    messages:
      PaymentProcessed:
        name: PaymentProcessed
        title: Payment Processed
        summary: Fired when payment is successfully processed
        payload:
          type: object
          properties:
            paymentId:
              type: string
              format: uuid
            orderId:
              type: string
              format: uuid
            amount:
              type: number
      PaymentFailed:
        name: PaymentFailed
        title: Payment Failed
        summary: Fired when payment processing fails
        payload:
          type: object
          properties:
            paymentId:
              type: string
              format: uuid
            orderId:
              type: string
              format: uuid
            reason:
              type: string

  inventory-events:
    address: 'ecommerce.inventory.{productId}'
    description: Product inventory changes
    parameters:
      productId:
        description: The product identifier
    messages:
      StockUpdated:
        name: StockUpdated
        title: Stock Updated
        summary: Fired when product stock levels change
        payload:
          type: object
          properties:
            productId:
              type: string
            oldQuantity:
              type: integer
            newQuantity:
              type: integer

  customer-notifications:
    address: 'ecommerce.notifications.{customerId}'
    description: Customer notification events
    parameters:
      customerId:
        description: The customer identifier
    messages:
      NotificationSent:
        name: NotificationSent
        title: Notification Sent
        summary: Fired when a notification is sent to customer
        payload:
          type: object
          properties:
            customerId:
              type: string
              format: uuid
            type:
              type: string
              enum: [email, sms, push]
            message:
              type: string

  analytics-events:
    address: 'ecommerce.analytics.events'
    description: Business analytics and metrics
    messages:
      UserAction:
        name: UserAction
        title: User Action
        summary: Tracks user interactions and behaviors
        payload:
          type: object
          properties:
            userId:
              type: string
            action:
              type: string
            timestamp:
              type: string
              format: date-time
      ConversionEvent:
        name: ConversionEvent
        title: Conversion Event
        summary: Tracks conversion funnel events
        payload:
          type: object
          properties:
            sessionId:
              type: string
            event:
              type: string
            value:
              type: number 
```

</p>
</details>

## Generating Type-Safe Channel Types

Create a configuration file to generate TypeScript channel types:

```js
// codegen.config.js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-channels.yaml',
  generators: [
    {
      preset: 'types',
      outputPath: './src/generated/types',
      language: 'typescript',
    }
  ]
};
```

> 📁 **See the complete configuration**: [codegen.config.js](https://github.com/the-codegen-project/cli/blob/main/examples/ecommerce-asyncapi-types/codegen.config.js)

Run the generator:

```bash
npx @the-codegen-project/cli generate codegen.config.js
```

This generates TypeScript types and utility functions:

```typescript
// Generated: src/generated/types/Types.ts
export type Topics = 'ecommerce.orders.{orderId}' | 'ecommerce.payments.{paymentId}' | 'ecommerce.inventory.{productId}' | 'ecommerce.notifications.{customerId}' | 'ecommerce.analytics.events';
export type TopicIds = 'order-events' | 'payment-events' | 'inventory-events' | 'customer-notifications' | 'analytics-events';
export function ToTopicIds(topic: Topics): TopicIds {
  switch (topic) {
    case 'ecommerce.orders.{orderId}':
    return 'order-events';
  case 'ecommerce.payments.{paymentId}':
    return 'payment-events';
  case 'ecommerce.inventory.{productId}':
    return 'inventory-events';
  case 'ecommerce.notifications.{customerId}':
    return 'customer-notifications';
  case 'ecommerce.analytics.events':
    return 'analytics-events';
    default:
      throw new Error('Unknown topic: ' + topic);
  }
}
export function ToTopics(topicId: TopicIds): Topics {
  switch (topicId) {
    case 'order-events':
    return 'ecommerce.orders.{orderId}';
  case 'payment-events':
    return 'ecommerce.payments.{paymentId}';
  case 'inventory-events':
    return 'ecommerce.inventory.{productId}';
  case 'customer-notifications':
    return 'ecommerce.notifications.{customerId}';
  case 'analytics-events':
    return 'ecommerce.analytics.events';
    default:
      throw new Error('Unknown topic ID: ' + topicId);
  }
}
```

## Using Generated Types in Your Application

Now you can build type-safe event publishers and subscribers:

### Type-Safe Event Publisher

```typescript
import { TopicIds, ToTopics } from './generated/types/Types';

export class EventPublisher {
  constructor(private messagingClient: any) {}

  async publish(topicId: TopicIds, data: any, parameters?: Record<string, string>) {
    let address = ToTopics(topicId);
    
    // Replace parameters in address template
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        address = address.replace(`{${key}}`, value) as any;
      }
    }
    
    await this.messagingClient.publish(address, data);
  }
}

// Usage with compile-time safety
const publisher = new EventPublisher(messagingClient);

// ✅ These work - TypeScript validates channel names
await publisher.publish('order-events', orderData, { orderId: '123' });
await publisher.publish('payment-events', paymentData, { paymentId: 'pay-456' });
await publisher.publish('analytics-events', analyticsData);

// ❌ This fails at compile time - unknown channel
await publisher.publish('unknown-channel', data); // TypeScript error!
```

### Type-Safe Event Router

```typescript
import { TopicIds } from './generated/types/Types';

type EventHandler = (data: any) => Promise<void>;

export class EventRouter {
  private handlers = new Map<TopicIds, EventHandler[]>();

  register(topicId: TopicIds, handler: EventHandler) {
    if (!this.handlers.has(topicId)) {
      this.handlers.set(topicId, []);
    }
    this.handlers.get(topicId)!.push(handler);
  }

  async route(topicId: TopicIds, data: any) {
    const handlers = this.handlers.get(topicId) || [];
    await Promise.all(handlers.map(handler => handler(data)));
  }
}

// Usage
const router = new EventRouter();

// ✅ Type-safe handler registration
router.register('order-events', async (data) => {
  console.log('Processing order event:', data);
});

router.register('payment-events', async (data) => {
  console.log('Processing payment event:', data);
});

// ❌ This fails at compile time
router.register('invalid-channel', handler); // TypeScript error!
```

### Integration with Message Brokers

The generated types work seamlessly with any messaging infrastructure:

#### With NATS

```typescript
import { connect } from 'nats';
import { TopicIds, ToTopics } from './generated/types/Types';

class NATSEventService {
  constructor(private nc: any) {}

  async subscribe(topicId: TopicIds, handler: (data: any) => void) {
    const addressTemplate = ToTopics(topicId);
    // Convert template to NATS subject pattern
    const subject = addressTemplate.replace(/\{[^}]+\}/g, '*');
    
    const sub = this.nc.subscribe(subject);
    for await (const msg of sub) {
      const data = JSON.parse(msg.data.toString());
      handler(data);
    }
  }

  async publish(topicId: TopicIds, data: any, parameters: Record<string, string>) {
    let subject = ToTopics(topicId);
    for (const [key, value] of Object.entries(parameters)) {
      subject = subject.replace(`{${key}}`, value);
    }
    this.nc.publish(subject, JSON.stringify(data));
  }
}
```

## Advanced Use Cases

### Environment-Specific Channel Mapping

```typescript
import { TopicIds, ToTopics } from './generated/types/Types';

class EnvironmentAwarePublisher {
  private getEnvironmentPrefix(): string {
    return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  }

  async publish(topicId: TopicIds, data: any, parameters?: Record<string, string>) {
    let address = ToTopics(topicId);
    
    // Add environment prefix
    const envPrefix = this.getEnvironmentPrefix();
    address = `${envPrefix}.${address}` as any;
    
    // Replace parameters
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        address = address.replace(`{${key}}`, value) as any;
      }
    }
    
    await this.messagingClient.publish(address, data);
  }
}
```

### Channel Health Monitoring

```typescript
import { TopicIds } from './generated/types/Types';

export class ChannelMonitor {
  private metrics = new Map<TopicIds, { published: number; errors: number }>();

  constructor() {
    // Initialize metrics for all known channels
    const channels: TopicIds[] = [
      'order-events', 
      'payment-events', 
      'inventory-events',
      'customer-notifications', 
      'analytics-events'
    ];
    
    channels.forEach(channel => {
      this.metrics.set(channel, { published: 0, errors: 0 });
    });
  }

  recordPublish(topicId: TopicIds) {
    const metric = this.metrics.get(topicId)!;
    metric.published++;
  }

  recordError(topicId: TopicIds) {
    const metric = this.metrics.get(topicId)!;
    metric.errors++;
  }

  getHealthReport() {
    const report: Record<string, any> = {};
    this.metrics.forEach((metric, topicId) => {
      report[topicId] = {
        published: metric.published,
        errors: metric.errors,
        errorRate: metric.published > 0 ? metric.errors / metric.published : 0
      };
    });
    return report;
  }
}
```

## Benefits of Generated Channel Types

1. **Compile-Time Safety**: TypeScript catches channel name errors before runtime
2. **IDE Support**: Full autocomplete and IntelliSense for channel names
3. **Refactoring Safety**: Renaming channels in your spec automatically updates all usage
4. **Documentation**: Channel types serve as living documentation of your event architecture
5. **Maintainability**: Central source of truth for all channel definitions


## Conclusion

Channel routing errors are among the most frustrating bugs in event-driven systems - they're easy to introduce and hard to debug. By generating TypeScript types from your AsyncAPI specification, you can eliminate these errors entirely while gaining the benefits of IDE support and safer refactoring.

The types generator creates a bridge between your API documentation and your implementation, ensuring they never drift apart. This small investment in code generation pays dividends in reduced debugging time and increased developer confidence.

Ready to make your channel routing bulletproof? Check out the [types generator documentation](https://the-codegen-project.org/docs/generators/types) and start generating your channel types today!

## Try It Yourself

Want to see this in action? Clone our [ecommerce-types example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-types) and run:

```bash
cd examples/ecommerce-asyncapi-types
npm install
npm run generate
npm run demo
```

This will generate the channel types and run a demonstration showing how they prevent common routing errors while providing excellent developer experience. 

## Additional Resources

### Documentation
- **[Types Generator Documentation](https://the-codegen-project.org/docs/generators/types)** - Complete guide to type generation options and configuration
- **[AsyncAPI Input Documentation](https://the-codegen-project.org/docs/inputs/asyncapi)** - Understanding AsyncAPI specifications for code generation
- **[E-commerce Types Example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-types)** - Complete working example from this blog post
- **[All Examples Repository](https://github.com/the-codegen-project/cli/tree/main/examples)** - Browse all available examples and use cases

