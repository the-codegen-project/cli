---
slug: asyncapi-parameters-generator
title: AsyncAPI - Dynamic Channel Routing Made Type-Safe
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, parameters, typescript, channels, routing]
---

Building event-driven applications often requires dynamic channel routing based on parameters like user IDs, tenant identifiers, or resource keys. Manually constructing these parameterized channels is error-prone and makes your code fragile. We've explored generating [payload models](../asyncapi-payload-generator), [headers](../asyncapi-headers-generator), and [type-safe channels](../asyncapi-types-generator). Now let's see how The Codegen Project's parameters generator creates type-safe models for dynamic channel construction.

<!-- truncate -->

## The Problem: Manual Channel Parameter Management

In event-driven e-commerce systems, you typically have parameterized channels for different resources:

```typescript
// Without type safety - error-prone manual construction
const orderChannel = `orders.${orderId}.events`;
const userChannel = `users.${userId}.notifications`;
const tenantChannel = `tenants.${tenantId}.${region}.updates`;
const inventoryChannel = `inventory.${warehouseId}.${productId}.updates`;

// What happens when parameters are missing or wrong?
const brokenChannel = `orders..events`;  // Empty orderId!
const wrongChannel = `orders.${userId}.events`;  // Wrong parameter!
const malformedChannel = `inventory.${warehouseId}.updates`; // Missing productId!
```

This leads to several problems:

1. **Runtime Failures**: Missing or wrong parameters create invalid channels that fail silently
2. **No Validation**: No way to ensure parameters match the expected format or constraints
3. **Hard to Extract**: Parsing parameters from received channel names is manual and error-prone
4. **Maintenance Burden**: Channel structure changes require updates throughout the codebase
5. **Type Safety**: No compile-time checking for parameter correctness
6. **Documentation Drift**: Parameter requirements aren't self-documenting in code

## The Solution: Generated Parameter Models

The Codegen Project's `parameters` preset generates TypeScript classes that handle parameter validation, channel construction, and parameter extraction automatically from your AsyncAPI specification.

## Real-World Example: E-commerce Messaging System

Let's build parameter models for a comprehensive e-commerce parameter system. Here's our AsyncAPI specification (`ecommerce-messaging-system.yaml`):

> 💡 **Complete Example**: You can find the full working example, including all files mentioned in this post, in our [ecommerce-parameters example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-parameters).

<details>
<summary>Show me the AsyncAPI document!</summary>
<p>

```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Messaging System
  version: 1.0.0
  description: Event-driven e-commerce system with comprehensive parameter handling for dynamic channel routing

channels:
  # Order Management - Multiple parameters
  order-events:
    address: 'ecommerce.orders.{orderId}.{eventType}'
    description: Order-specific events with event type classification
    parameters:
      orderId:
        description: Unique order identifier (UUID format)
        examples: ['123e4567-e89b-12d3-a456-426614174000']
      eventType:
        description: Type of order event
        enum: [created, updated, shipped, delivered, cancelled, refunded]
    messages:
      OrderEvent:
        payload:
          type: object
          properties:
            orderId: { type: string }
            eventType: { type: string }
            timestamp: { type: string, format: date-time }

  # User Management - Hierarchical parameters
  user-notifications:
    address: 'ecommerce.users.{region}.{userId}.{notificationType}'
    description: User notifications with regional routing
    parameters:
      region:
        description: Geographic region for routing
        enum: [us-east, us-west, eu-central, ap-southeast]
      userId:
        description: User identifier (UUID format)
        examples: ['987fcdeb-51a2-43d1-9c4f-123456789abc']
      notificationType:
        description: Type of notification
        enum: [email, sms, push, webhook]
    messages:
      UserNotification:
        payload:
          type: object
          properties:
            userId: { type: string }
            message: { type: string }
            notificationType: { type: string }

  # Product Management - Category-based routing
  product-updates:
    address: 'ecommerce.products.{category}.{productId}.updates'
    description: Product updates organized by category
    parameters:
      category:
        description: Product category for efficient routing
        enum: [electronics, clothing, books, home, sports]
      productId:
        description: Product identifier (format PROD-XXXXXXXX)
        examples: ['PROD-12AB34CD']
    messages:
      ProductUpdate:
        payload:
          type: object
          properties:
            productId: { type: string }
            category: { type: string }
            changes: { type: object }

  # Multi-tenant Analytics - Complex parameter structure
  tenant-analytics:
    address: 'analytics.{tenantId}.{environmentType}.{metricType}.{aggregationPeriod}'
    description: Multi-dimensional analytics with tenant isolation
    parameters:
      tenantId:
        description: Tenant identifier for data isolation (format tenant-xxxxxxxx)
        examples: ['tenant-abc123', 'tenant-xyz789def']
      environmentType:
        description: Environment for proper data segregation
        enum: [production, staging, development]
      metricType:
        description: Type of metric being tracked
        enum: [sales, inventory, user-behavior, performance]
      aggregationPeriod:
        description: Time period for metric aggregation
        enum: [minute, hour, day, week, month]
    messages:
      AnalyticsEvent:
        payload:
          type: object
          properties:
            tenantId: { type: string }
            metricType: { type: string }
            value: { type: number }
            timestamp: { type: string, format: date-time }

  # Inventory Management - Location-based parameters
  inventory-updates:
    address: 'inventory.{warehouseId}.{zone}.{productId}'
    description: Inventory updates with precise location tracking
    parameters:
      warehouseId:
        description: Warehouse identifier (format WH-XX-000)
        examples: ['WH-US-001', 'WH-EU-042']
      zone:
        description: Zone within warehouse (format X-00)
        examples: ['A-01', 'B-15', 'C-23']
      productId:
        description: Product being updated (format PROD-XXXXXXXX)
        examples: ['PROD-12AB34CD']
    messages:
      InventoryUpdate:
        payload:
          type: object
          properties:
            warehouseId: { type: string }
            zone: { type: string }
            productId: { type: string }
            quantityChange: { type: integer }

  # Customer Support - Priority-based routing
  support-tickets:
    address: 'support.{priority}.{department}.{ticketId}'
    description: Support tickets with priority and department routing
    parameters:
      priority:
        description: Ticket priority for routing
        enum: [low, medium, high, critical]
      department:
        description: Support department
        enum: [technical, billing, general, returns]
      ticketId:
        description: Support ticket identifier (format TICKET-00000000)
        examples: ['TICKET-12345678']
    messages:
      SupportTicket:
        payload:
          type: object
          properties:
            ticketId: { type: string }
            priority: { type: string }
            department: { type: string }
            description: { type: string }

  # Simple parameter example
  user-activity:
    address: 'activity.{userId}'
    description: Simple user activity tracking
    parameters:
      userId:
        description: User performing the activity (UUID format)
        examples: ['550e8400-e29b-41d4-a716-446655440000']
    messages:
      UserActivity:
        payload:
          type: object
          properties:
            userId: { type: string }
            action: { type: string }
            timestamp: { type: string, format: date-time } 
```

</p>
</details>

## Generating the Parameter Models

Create a configuration file to generate TypeScript parameter models:

```js
// codegen.config.js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-messaging-system.yaml',
  generators: [
    {
      preset: 'parameters',
      outputPath: './src/generated/parameters',
      language: 'typescript',
    }
  ]
};
```

> 📁 **See the complete configuration**: [codegen.config.js](https://github.com/the-codegen-project/cli/blob/main/examples/ecommerce-asyncapi-parameters/codegen.config.js)

Run the generator:

```bash
npx @the-codegen-project/cli generate codegen.config.js
```

This generates TypeScript classes for each channel's parameters with built-in channel construction and parameter extraction:

```typescript
// Generated: src/generated/parameters/OrderEventsParameters.ts
import { EventType } from './EventType';

export class OrderEventsParameters {
  private _orderId: string;
  private _eventType: EventType;

  constructor(input: {
    orderId: string,
    eventType: EventType,
  }) {
    this._orderId = input.orderId;
    this._eventType = input.eventType;
  }

  /**
   * Unique order identifier (UUID format)
   * @example 123e4567-e89b-12d3-a456-426614174000
   */
  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  /**
   * Type of order event
   */
  get eventType(): EventType { return this._eventType; }
  set eventType(eventType: EventType) { this._eventType = eventType; }

  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string): string {
    channel = channel.replace(/\{orderId\}/g, this.orderId);
    channel = channel.replace(/\{eventType\}/g, this.eventType);
    return channel;
  }
  
  /**
   * Extract parameters from a channel name using regex pattern matching
   */
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): OrderEventsParameters {
    const parameters = new OrderEventsParameters({orderId: '', eventType: "created"});
    const match = msgSubject.match(regex);
    const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

    if (match) {
      const orderIdMatch = match[sequentialParameters.indexOf('{orderId}')+1];
      if(orderIdMatch && orderIdMatch !== '') {
        parameters.orderId = orderIdMatch;
      } else {
        throw new Error(`Parameter: 'orderId' is not valid. Abort!`);
      }
      
      const eventTypeMatch = match[sequentialParameters.indexOf('{eventType}')+1];
      if(eventTypeMatch && eventTypeMatch !== '') {
        parameters.eventType = eventTypeMatch as EventType;
      } else {
        throw new Error(`Parameter: 'eventType' is not valid. Abort!`);
      }
    } else {
      throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`);
    }
    return parameters;
  }
}
```

## Using Generated Parameter Models in Your Infrastructure

Now you can use these generated parameter models with any messaging infrastructure for dynamic channel routing:

### With NATS

```typescript
import { connect } from 'nats';
import { OrderEventsParameters } from './generated/parameters/OrderEventsParameters';
import { InventoryUpdatesParameters } from './generated/parameters/InventoryUpdatesParameters';
import { EventType } from './generated/parameters/EventType';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Publishing to dynamic channels with type-safe parameters
async function publishOrderEvent(orderId: string, eventType: EventType, payload: any) {
  const params = new OrderEventsParameters({ orderId, eventType });
  const channelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
  const channelName = params.getChannelWithParameters(channelTemplate);
  // Result: "ecommerce.orders.123e4567-e89b-12d3-a456-426614174000.created"
  
  await nc.publish(channelName, JSON.stringify(payload));
}

// Subscribing with wildcard patterns and parameter extraction
const orderSub = nc.subscribe('ecommerce.orders.*.>');
for await (const msg of orderSub) {
  try {
    // Extract parameters from received channel
    const regex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
    const channelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
    const params = OrderEventsParameters.createFromChannel(msg.subject, channelTemplate, regex);
    
    console.log(`Processing ${params.eventType} event for order: ${params.orderId}`);
    await processOrderEvent(params.orderId, params.eventType, msg.data);
  } catch (error) {
    console.error('Failed to extract parameters:', error.message);
  }
}
```

### With Kafka

```typescript
import { Kafka } from 'kafkajs';
import { OrderEventsParameters } from './generated/parameters/OrderEventsParameters';
import { EventType } from './generated/parameters/EventType';

const kafka = new Kafka({ clientId: 'order-service', brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function publishOrderStatusChange(orderId: string, eventType: EventType, payload: any) {
  const params = new OrderEventsParameters({ orderId, eventType });
  const channel = 'ecommerce_orders_{orderId}_{eventType}';
  const channelName = params.getChannelWithParameters(channelTemplate);
  
  await producer.send({
    topic: channel,
    messages: [{
      key: orderId,
      value: JSON.stringify(payload),
      // Store original channel name for parameter extraction
      headers: {
        'x-channel-name': Buffer.from(channelName),
        'x-order-id': Buffer.from(orderId),
        'x-event-type': Buffer.from(eventType)
      }
    }]
  });
}

// Consumer with parameter extraction
const consumer = kafka.consumer({ groupId: 'order-processor' });
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    try {
      // Extract parameters from headers or reconstruct from topic name
      const channelName = message.headers?.['x-channel-name']?.toString()
      
      const regex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
      const channelTemplate = 'ecommerce_orders_{orderId}_{eventType}';
      const params = OrderEventsParameters.createFromChannel(channelName, channelTemplate, regex);
      
      await processOrderEvent(params.orderId, params.eventType, message.value);
    } catch (error) {
      console.error('Failed to extract parameters from Kafka message:', error.message);
    }
  }
});
```

## Practical Examples from Our Demo

Here are some real examples from our [working demonstration](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-parameters) that show the generated parameter models in action:

### Order Processing Pipeline

```typescript
import { OrderEventsParameters } from './generated/parameters/OrderEventsParameters';
import { EventType } from './generated/parameters/EventType';

// Process order through its lifecycle with type-safe parameters
async function processOrderLifecycle(orderId: string) {
  const orderEvents: EventType[] = ['created', 'updated', 'shipped', 'delivered'];
  const orderChannelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
  
  for (const eventType of orderEvents) {
    const params = new OrderEventsParameters({ orderId, eventType });
    const channel = params.getChannelWithParameters(orderChannelTemplate);
    
    console.log(`Step ${orderEvents.indexOf(eventType) + 1}: ${channel}`);
    await publishOrderEvent(channel, { orderId, eventType, timestamp: new Date() });
  }
}

// Extract parameters from received order events
async function handleOrderEvent(channelName: string, message: any) {
  try {
    const regex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
    const channelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
    const params = OrderEventsParameters.createFromChannel(channelName, channelTemplate, regex);
    
    console.log(`Processing ${params.eventType} event for order: ${params.orderId}`);
    
    // Route to appropriate handler based on event type
    switch (params.eventType) {
      case 'created':
        await processNewOrder(params.orderId, message);
        break;
      case 'shipped':
        await notifyCustomerShipped(params.orderId, message);
        break;
      case 'delivered':
        await finalizeOrder(params.orderId, message);
        break;
    }
  } catch (error) {
    console.error('Failed to process order event:', error.message);
  }
}
```

### Error Handling and Parameter Extraction

```typescript
// Safe parameter extraction with comprehensive error handling
async function safeProcessMessage(channelName: string, message: any) {
  // Try to extract order parameters
  try {
    const orderRegex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
    if (orderRegex.test(channelName)) {
      const params = OrderEventsParameters.createFromChannel(
        channelName, 
        'ecommerce.orders.{orderId}.{eventType}', 
        orderRegex
      );
      return await processOrderEvent(params, message);
    }
  } catch (error) {
    console.warn('Not an order event, trying other patterns...');
  }
  
  // Try to extract notification parameters
  try {
    const notificationRegex = /^ecommerce\.users\.([^.]+)\.([^.]+)\.([^.]+)$/;
    if (notificationRegex.test(channelName)) {
      const params = UserNotificationsParameters.createFromChannel(
        channelName,
        'ecommerce.users.{region}.{userId}.{notificationType}',
        notificationRegex
      );
      return await processNotification(params, message);
    }
  } catch (error) {
    console.warn('Not a notification event, trying other patterns...');
  }
  
  console.error(`Unknown channel pattern: ${channelName}`);
}
```

## Conclusion

By generating parameter models from your AsyncAPI specification, you eliminate the fragility and errors that come with manual channel construction. This approach provides type-safe, that scales with your application's complexity.

Whether you're building simple user notification systems or complex multi-tenant analytics platforms, generated parameter models ensure your channel routing is reliable, type-safe, and maintainable.

## Try It Yourself

Want to see this in action? Checkout the [ecommerce-parameters example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-parameters) and run:

```bash
cd examples/ecommerce-asyncapi-parameters
npm install
npm run generate
npm run demo
```

This will generate the parameter models and run a comprehensive demonstration showing how they handle complex channel parameterization, validation, and extraction patterns.

## Additional Resources

### Documentation
- **[Parameters Generator Documentation](/docs/generators/parameters)** - Complete guide to parameter generation options and configuration
- **[AsyncAPI Input Documentation](/docs/inputs/asyncapi)** - Understanding AsyncAPI specifications for code generation
- **[E-commerce Parameters Example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-parameters)** - Complete working example from this blog post

### Related Protocols
- **[NATS Protocol](/docs/protocols/nats)** - Using generated parameters with NATS messaging
- **[Kafka Protocol](/docs/protocols/kafka)** - Using generated parameters with Apache Kafka
- **[HTTP Protocol](/docs/protocols/http)** - Using generated parameters with HTTP APIs

### Related Generators
- **[AsyncAPI Payload Generator](../asyncapi-payload-generator)** - Generate type-safe payload models
- **[AsyncAPI Headers Generator](../asyncapi-headers-generator)** - Generate type-safe header models
- **[AsyncAPI Types Generator](../asyncapi-types-generator)** - Generate unified type definitions