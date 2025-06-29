---
slug: asyncapi-channel-generator
title: AsyncAPI - Protocol-Specific Messaging Functions
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, channels, typescript, messaging, protocols, automation]
---

Building scalable event-driven applications requires robust messaging infrastructure that works seamlessly with your chosen protocols. We've covered [payload generation](../asyncapi-payload-generator), [header management](../asyncapi-headers-generator), and [type-safe routing](../asyncapi-types-generator). Now let's explore how The Codegen Project's channels generator creates protocol-specific functions that streamline your messaging architecture while working with your favorite messaging systems.

<!-- truncate -->

## The Problem: Protocol-Specific Integration

When building event-driven order management systems, you typically need:

1. **Protocol Integration** - Working seamlessly with NATS, Kafka, MQTT, AMQP, or HTTP
2. **Channel Management** - Publishing and subscribing to channels with proper addressing
3. **Type-Safe Operations** - Ensuring messages are sent with correct payloads and parameters
4. **Parameter Handling** - Managing dynamic channel addresses with parameters
5. **Protocol Abstraction** - Clean abstractions over complex protocol APIs

Without automated channel generation, teams often struggle with:
- Boilerplate code for each protocol integration
- Manual construction of channel addresses with parameters
- Protocol-specific quirks and configuration management
- Inconsistent patterns across different messaging systems

## The Solution: Generated Protocol Functions + Your Infrastructure

The Codegen Project's `channels` preset generates protocol-specific functions from your AsyncAPI specification, providing clean abstractions for publishing and subscribing while automatically including payload and parameter validation.

## Real-World Example: Order Lifecycle Management

Let's build protocol-specific functions for order lifecycle management. Here's our AsyncAPI specification focused on order operations:

> 💡 **Complete Example**: You can find the full working example, including all files mentioned in this post, in our [ecommerce-channels example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-channels).

<details>
<summary>Show me the AsyncAPI document!</summary>
<p>

```yaml
asyncapi: 3.0.0
info:
  title: E-commerce Order Lifecycle Events
  version: 1.0.0
  description: Event-driven order management system with comprehensive lifecycle tracking

channels:
  # Order Management Channels
  order-lifecycle:
    address: orders.{action}
    parameters:
      action:
        $ref: '#/components/parameters/OrderAction'
    messages:
      OrderCreated:
        $ref: '#/components/messages/OrderCreated'
      OrderUpdated:
        $ref: '#/components/messages/OrderUpdated'
      OrderCancelled:
        $ref: '#/components/messages/OrderCancelled'

operations:
  # Order Management Operations
  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/order-lifecycle'
    messages:
      - $ref: '#/channels/order-lifecycle/messages/OrderCreated'

  publishOrderUpdated:
    action: send
    channel:
      $ref: '#/channels/order-lifecycle'
    messages:
      - $ref: '#/channels/order-lifecycle/messages/OrderUpdated'

  publishOrderCancelled:
    action: send
    channel:
      $ref: '#/channels/order-lifecycle'
    messages:
      - $ref: '#/channels/order-lifecycle/messages/OrderCancelled'

  subscribeToOrderEvents:
    action: receive
    channel:
      $ref: '#/channels/order-lifecycle'
    messages:
      - $ref: '#/channels/order-lifecycle/messages/OrderCreated'
      - $ref: '#/channels/order-lifecycle/messages/OrderUpdated'
      - $ref: '#/channels/order-lifecycle/messages/OrderCancelled'

components:
  # Reusable Parameters
  parameters:
    OrderAction:
      enum: [created, updated, cancelled, shipped, delivered]
      description: Order lifecycle action

  # Reusable Messages
  messages:
    OrderCreated:
      name: OrderCreated
      title: Order Created Event
      summary: Published when a new order is created
      payload:
        $ref: '#/components/schemas/OrderCreatedPayload'
      headers:
        $ref: '#/components/schemas/OrderHeaders'

    OrderUpdated:
      name: OrderUpdated
      title: Order Updated Event
      summary: Published when order details are modified
      payload:
        $ref: '#/components/schemas/OrderUpdatedPayload'
      headers:
        $ref: '#/components/schemas/OrderHeaders'

    OrderCancelled:
      name: OrderCancelled
      title: Order Cancelled Event
      summary: Published when an order is cancelled
      payload:
        $ref: '#/components/schemas/OrderCancelledPayload'
      headers:
        $ref: '#/components/schemas/OrderHeaders'

  schemas:
    # Order Payload Schemas
    OrderCreatedPayload:
      type: object
      required: [orderId, customerId, items, totalAmount]
      properties:
        orderId:
          type: string
          format: uuid
        customerId:
          type: string
          format: uuid
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
        totalAmount:
          $ref: '#/components/schemas/Money'
        shippingAddress:
          $ref: '#/components/schemas/Address'
        createdAt:
          type: string
          format: date-time

    OrderUpdatedPayload:
      type: object
      required: [orderId, status, updatedAt]
      properties:
        orderId:
          type: string
          format: uuid
        status:
          $ref: '#/components/schemas/OrderStatus'
        updatedAt:
          type: string
          format: date-time
        reason:
          type: string
        updatedFields:
          type: array
          items:
            type: string

    OrderStatus:
      type: string
      enum: [pending, confirmed, processing, shipped, delivered, cancelled]
    OrderCancelledPayload:
      type: object
      required: [orderId, reason, cancelledAt]
      properties:
        orderId:
          type: string
          format: uuid
        reason:
          type: string
        cancelledAt:
          type: string
          format: date-time
        refundAmount:
          $ref: '#/components/schemas/Money'

    # Order Header Schema
    OrderHeaders:
      type: object
      required: [x-correlation-id, x-order-id, x-customer-id]
      properties:
        x-correlation-id:
          type: string
          format: uuid
        x-order-id:
          type: string
          format: uuid
        x-customer-id:
          type: string
          format: uuid
        x-source-service:
          type: string

    # Supporting Schemas
    OrderItem:
      type: object
      required: [productId, quantity, unitPrice]
      properties:
        productId:
          type: string
          format: uuid
        quantity:
          type: integer
          minimum: 1
        unitPrice:
          $ref: '#/components/schemas/Money'
        productName:
          type: string
        productCategory:
          type: string

    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: integer
          minimum: 0
          description: Amount in smallest currency unit (e.g., cents for USD)
        currency:
          $ref: '#/components/schemas/Currency'
    Currency:
      type: string
      enum: [USD, EUR, GBP]
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
        postalCode:
          type: string 
```

</p>
</details>

## Generating Protocol-Specific Functions

Create a configuration file to generate protocol-specific functions:

```js
// codegen.config.js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-event-channels.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['nats', 'kafka']
    }
  ]
};
```

> 📁 **See the complete configuration**: [codegen.config.js](https://github.com/the-codegen-project/cli/blob/main/examples/ecommerce-asyncapi-channels/codegen.config.js)

Run the generator:

```bash
npx @the-codegen-project/cli generate codegen.config.js
```

> 💡 **Automatic Dependencies**: The channels generator automatically includes the `payloads` and `parameters` generators, so you get complete type-safe models alongside your protocol functions.

This generates a single file with protocol-specific functions organized by protocol. The function names are based on your operation names from the AsyncAPI specification:

```typescript
// Generated: src/generated/index.ts
import { OrderCreated } from './payload/OrderCreated';
import { OrderUpdated } from './payload/OrderUpdated';
import { OrderCancelled } from './payload/OrderCancelled';
import * as SubscribeToOrderEventsPayloadModule from './payload/SubscribeToOrderEventsPayload';
import { OrderLifecycleParameters } from './parameter/OrderLifecycleParameters';
import * as Nats from 'nats';
import * as Kafka from 'kafkajs';

export const Protocols = {
  nats: {
    // NATS-specific functions for order operations
    publishToPublishOrderCreated: ({
      message, 
      parameters, 
      nc, 
      codec = Nats.JSONCodec(), 
      options
    }: {
      message: OrderCreated, 
      parameters: OrderLifecycleParameters, 
      nc: Nats.NatsConnection, 
      codec?: Nats.Codec<any>, 
      options?: Nats.PublishOptions
    }): Promise<void> => {
      // Implementation handles validation, serialization
    },

    publishToPublishOrderUpdated: ({
      message, 
      parameters, 
      nc, 
      codec = Nats.JSONCodec(), 
      options
    }: {
      message: OrderUpdated, 
      parameters: OrderLifecycleParameters, 
      nc: Nats.NatsConnection, 
      codec?: Nats.Codec<any>, 
      options?: Nats.PublishOptions
    }): Promise<void> => {
      // Implementation handles validation, serialization
    },

    publishToPublishOrderCancelled: ({
      message, 
      parameters, 
      nc, 
      codec = Nats.JSONCodec(), 
      options
    }: {
      message: OrderCancelled, 
      parameters: OrderLifecycleParameters, 
      nc: Nats.NatsConnection, 
      codec?: Nats.Codec<any>, 
      options?: Nats.PublishOptions
    }): Promise<void> => {
      // Implementation handles validation, serialization
    },

    // JetStream support
    jetStreamPublishToPublishOrderCreated: ({
      message, 
      parameters, 
      js, 
      codec = Nats.JSONCodec(), 
      options = {}
    }: {
      message: OrderCreated, 
      parameters: OrderLifecycleParameters, 
      js: Nats.JetStreamClient, 
      codec?: Nats.Codec<any>, 
      options?: Partial<Nats.JetStreamPublishOptions>
    }): Promise<void> => {
      // Implementation handles validation, serialization
    },

    // Subscription functions with callback-based API
    subscribeToSubscribeToOrderEvents: ({
      onDataCallback, 
      parameters, 
      nc, 
      codec = Nats.JSONCodec(), 
      options, 
      skipMessageValidation = false
    }: {
      onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, natsMsg?: Nats.Msg) => void, 
      parameters: OrderLifecycleParameters, 
      nc: Nats.NatsConnection, 
      codec?: Nats.Codec<any>, 
      options?: Nats.SubscriptionOptions, 
      skipMessageValidation?: boolean
    }): Promise<Nats.Subscription> => {
      // Implementation handles validation, deserialization, and callback invocation
    },

    // JetStream subscription support
    jetStreamPullSubscribeToSubscribeToOrderEvents: ({
      onDataCallback, 
      parameters, 
      js, 
      options, 
      codec = Nats.JSONCodec(), 
      skipMessageValidation = false
    }: {
      onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
      parameters: OrderLifecycleParameters, 
      js: Nats.JetStreamClient, 
      options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
      codec?: Nats.Codec<any>, 
      skipMessageValidation?: boolean
    }): Promise<Nats.JetStreamPullSubscription> => {
      // Implementation handles validation, deserialization, and callback invocation
    }
  },

  kafka: {
    // Kafka-specific functions for order operations  
    produceToPublishOrderCreated: ({
      message, 
      parameters, 
      kafka
    }: {
      message: OrderCreated, 
      parameters: OrderLifecycleParameters, 
      kafka: Kafka.Kafka
    }): Promise<Kafka.Producer> => {
      // Implementation handles validation, serialization
    },

    produceToPublishOrderUpdated: ({
      message, 
      parameters, 
      kafka
    }: {
      message: OrderUpdated, 
      parameters: OrderLifecycleParameters, 
      kafka: Kafka.Kafka
    }): Promise<Kafka.Producer> => {
      // Implementation handles validation, serialization
    },

    produceToPublishOrderCancelled: ({
      message, 
      parameters, 
      kafka
    }: {
      message: OrderCancelled, 
      parameters: OrderLifecycleParameters, 
      kafka: Kafka.Kafka
    }): Promise<Kafka.Producer> => {
      // Implementation handles validation, serialization
    },

    // Kafka consumer functions with callback-based API
    consumeFromSubscribeToOrderEvents: ({
      onDataCallback, 
      parameters, 
      kafka, 
      options = {fromBeginning: true, groupId: ''}, 
      skipMessageValidation = false
    }: {
      onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, kafkaMsg?: Kafka.EachMessagePayload) => void, 
      parameters: OrderLifecycleParameters, 
      kafka: Kafka.Kafka, 
      options: {fromBeginning: boolean, groupId: string}, 
      skipMessageValidation?: boolean
    }): Promise<Kafka.Consumer> => {
      // Implementation handles topic subscription, validation, and callback invocation
    }
  }
};
```

## Using Generated Functions in Your Services

Now you can use these protocol-specific functions to build robust order management services:

### Order Service with NATS

```typescript
import { connect } from 'nats';
import { Protocols } from './generated';
import { OrderCreated } from './generated/payload/OrderCreated';
import { OrderUpdated } from './generated/payload/OrderUpdated';
import { OrderCancelled } from './generated/payload/OrderCancelled';
import { OrderLifecycleParameters } from './generated/parameter/OrderLifecycleParameters';

const { nats } = Protocols;

class OrderService {
  private connection!: NatsConnection;

  async initialize() {
    this.connection = await connect({ servers: 'nats://localhost:4222' });
    await this.setupEventHandlers();
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // Create the order
    const order = await this.repository.createOrder(orderData);

    // Publish order created event using generated function
    const orderCreatedMessage = new OrderCreated({
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      createdAt: new Date().toISOString()
    });

    const orderCreatedParams = new OrderLifecycleParameters({ action: 'created' });

    await nats.publishToPublishOrderCreated({
      message: orderCreatedMessage,
      parameters: orderCreatedParams,
      nc: this.connection
    });

    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.repository.updateOrderStatus(orderId, status);

    // Publish order updated event
    const orderUpdatedMessage = new OrderUpdated({
      orderId,
      status,
      updatedAt: new Date().toISOString(),
      reason: `Status changed to ${status}`,
      updatedFields: ['status']
    });

    const orderUpdatedParams = new OrderLifecycleParameters({ action: 'updated' });

    await nats.publishToPublishOrderUpdated({
      message: orderUpdatedMessage,
      parameters: orderUpdatedParams,
      nc: this.connection
    });
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const order = await this.repository.getOrder(orderId);
    await this.repository.cancelOrder(orderId);

    // Publish order cancelled event
    const orderCancelledMessage = new OrderCancelled({
      orderId,
      reason,
      cancelledAt: new Date().toISOString(),
      refundAmount: order.totalAmount
    });

    const orderCancelledParams = new OrderLifecycleParameters({ action: 'cancelled' });

    await nats.publishToPublishOrderCancelled({
      message: orderCancelledMessage,
      parameters: orderCancelledParams,
      nc: this.connection
    });
  }

  private async setupEventHandlers(): Promise<void> {
    // Subscribe to all order events for logging and monitoring
    const orderEventsParams = new OrderLifecycleParameters({ action: 'created' });
    await nats.subscribeToSubscribeToOrderEvents({
      onDataCallback: (err, message, parameters, natsMsg) => {
        if (err) {
          console.error('[Handler] Error processing order event:', err.message);
          return;
        }
        this.handleOrderEvent(message, parameters);
      },
      parameters: orderEventsParams,
      nc: this.connection
    });
  }

  private async handleOrderEvent(message: any, parameters: OrderLifecycleParameters): Promise<void> {
    console.log(`[OrderService] Received order event: ${parameters.action}`, message);
    
    // Add business logic here (logging, analytics, etc.)
    switch (parameters.action) {
      case 'created':
        await this.handleOrderCreated(message);
        break;
      case 'updated':
        await this.handleOrderUpdated(message);
        break;
      case 'cancelled':
        await this.handleOrderCancelled(message);
        break;
    }
  }

  private async handleOrderCreated(message: any): Promise<void> {
    console.log(`[OrderService] Order created: ${message.orderId}`);
    // Send welcome email, trigger fulfillment, etc.
  }

  private async handleOrderUpdated(message: any): Promise<void> {
    console.log(`[OrderService] Order updated: ${message.orderId} -> ${message.status}`);
    // Update customer, send notifications, etc.
  }

  private async handleOrderCancelled(message: any): Promise<void> {
    console.log(`[OrderService] Order cancelled: ${message.orderId}`);
    // Process refund, send cancellation email, etc.
  }
}
```

### Warehouse Service with Kafka

```typescript
import { Kafka } from 'kafkajs';
import { Protocols } from './generated';
import { OrderUpdated } from './generated/payload/OrderUpdated';
import { OrderLifecycleParameters } from './generated/parameter/OrderLifecycleParameters';

const { kafka } = Protocols;

class WarehouseService {
  private kafkaClient!: Kafka;

  async initialize() {
    this.kafkaClient = new Kafka({
      clientId: 'warehouse-service',
      brokers: ['localhost:9092']
    });
    
    await this.setupEventHandlers();
  }

  async setupEventHandlers(): Promise<void> {
    // Subscribe to order creation events to trigger fulfillment
    const orderCreatedParams = new OrderLifecycleParameters({ action: 'created' });
    await kafka.consumeFromSubscribeToOrderEvents({
      onDataCallback: (err, message, parameters, kafkaMsg) => {
        if (err) {
          console.error('[Warehouse] Error processing order event:', err.message);
          return;
        }
        if (parameters?.action === 'created') {
          this.handleOrderCreated(message);
        }
      },
      parameters: orderCreatedParams,
      kafka: this.kafkaClient,
      options: { fromBeginning: true, groupId: 'warehouse-service' }
    });
  }

  private async handleOrderCreated(message: any): Promise<void> {
    console.log(`[Warehouse] Processing order for fulfillment: ${message.orderId}`);
    
    // Check inventory, allocate items, etc.
    const fulfillmentResult = await this.processFulfillment(message);
    
    if (fulfillmentResult.success) {
      // Update order status to processing
      const orderUpdatedMessage = new OrderUpdated({
        orderId: message.orderId,
        status: 'processing',
        updatedAt: new Date().toISOString(),
        reason: 'Items allocated and processing started',
        updatedFields: ['status']
      });

      const orderUpdatedParams = new OrderLifecycleParameters({ action: 'updated' });

      await kafka.produceToPublishOrderUpdated({
        message: orderUpdatedMessage,
        parameters: orderUpdatedParams,
        kafka: this.kafkaClient
      });
    }
  }

  private async processFulfillment(order: any): Promise<{success: boolean}> {
    // Warehouse fulfillment logic
    console.log(`[Warehouse] Allocating inventory for order ${order.orderId}`);
    return { success: true };
  }
}
```

## Advanced Protocol Features

### NATS JetStream Integration

```typescript
import { connect, jetstreamManager } from 'nats';
import { Protocols } from './generated';

const { nats } = Protocols;

class OrderOrchestrator {
  private connection!: NatsConnection;
  private jetStream!: any;

  async initialize() {
    this.connection = await connect({ servers: 'nats://localhost:4222' });
    const jsm = await jetstreamManager(this.connection);
    this.jetStream = this.connection.jetstream();
    
    // Create stream for order events
    await jsm.streams.add({
      name: 'ORDER_EVENTS',
      subjects: ['orders.*'],
      retention: 'limits',
      max_age: 7 * 24 * 60 * 60 * 1000_000_000 // 7 days in nanoseconds
    });
  }

  async orchestrateOrderFlow(order: OrderCreated): Promise<void> {
    const orderCreatedParams = new OrderLifecycleParameters({ action: 'created' });

    // Publish to JetStream for durability
    await nats.jetStreamPublishToPublishOrderCreated({
      message: order,
      parameters: orderCreatedParams,
      js: this.jetStream
    });

    // Set up durable subscription for processing
    await nats.jetStreamPullSubscribeToSubscribeToOrderEvents({
      onDataCallback: (err, message, parameters, natsMsg) => {
        if (err) {
          console.error('[JetStream] Error processing order event:', err.message);
          return;
        }
        this.processOrderEvent(message);
      },
      parameters: orderCreatedParams,
      js: this.jetStream,
      options: { durable_name: 'order-processor' }
    });
  }
}
```

### Multi-Protocol Support

```typescript
import { Protocols } from './generated';

const { nats, kafka } = Protocols;

class HybridOrderService {
  private natsConnection!: NatsConnection;
  private kafkaClient!: Kafka;

  // Use NATS for real-time order updates
  async publishRealTimeOrderUpdate(event: OrderUpdated) {
    const params = new OrderLifecycleParameters({ action: 'updated' });
    await nats.publishToPublishOrderUpdated({
      message: event,
      parameters: params,
      nc: this.natsConnection
    });
  }

  // Use Kafka for order analytics and reporting
  async publishOrderAnalytics(event: OrderCreated) {
    const params = new OrderLifecycleParameters({ action: 'created' });
    await kafka.produceToPublishOrderCreated({
      message: event,
      parameters: params,
      kafka: this.kafkaClient
    });
  }
}
```

## Configuration Options

The channels generator provides several options to customize the generated functions:

### Reverse Operations for Testing
In case you wish to generate the reverse operations for, usually great for integration or system testing:
```js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-event-channels.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['nats'],
      // Reverse operations - send becomes receive and vice versa
      asyncapiReverseOperations: true
    }
  ]
};
```

### Custom Function Types
Instead of relying on operations, you can also use the configuration file to define explicitly what protocol functions to include.

```js
export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-event-channels.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['nats'],
      // Generate for channels and ignore operations
      asyncapiGenerateForOperations: false,
      // Generate specific function types for channels
      functionTypeMapping: {
        'order-lifecycle': ['nats_publish', 'kafka_publish']
      }
    }
  ]
};
```

## Benefits of This Approach

1. **Protocol Abstraction**: Clean, consistent APIs across different messaging systems
2. **Type Safety**: Full TypeScript support with compile-time validation
3. **Parameter Handling**: Automatic construction of channel addresses with parameters using `getChannelWithParameters()`
4. **Payload Integration**: Seamless integration with generated payload models using `marshal()` and `unmarshal()`
5. **Protocol Flexibility**: Use the same AsyncAPI spec with multiple protocols
6. **Infrastructure Freedom**: Integrate with existing connections and configurations
7. **Operation-Based**: Generate functions based on your defined operations with descriptive names
8. **Runtime Validation**: Built-in message validation with error handling
9. **Callback-Based APIs**: Event-driven architecture with error-first callbacks

## Conclusion

By generating protocol-specific functions from your AsyncAPI specification, you create clean abstractions over complex messaging systems. These functions handle parameter substitution, type safety, protocol-specific integration patterns, and runtime validation automatically.

The generated functions work seamlessly with popular messaging systems like NATS, Kafka, MQTT, and AMQP, providing consistent APIs regardless of your chosen protocol. Combined with automatic payload and parameter generation, you get a complete messaging solution that evolves with your API specifications.

Ready to try it yourself? Check out the [channels generator documentation](/docs/generators/channels) and start building your protocol-specific messaging functions today!

## Try It Yourself

Want to see this in action? Clone our [ecommerce-asyncapi-channels example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-channels) and run:

```bash
cd examples/ecommerce-asyncapi-channels
npm install
npm run generate
npm run demo
```

This will generate the protocol-specific functions and run a comprehensive demonstration showing how they work with NATS, Kafka, and other messaging systems.

## Additional Resources

### Documentation
- **[Channels Generator Documentation](/docs/generators/channels)** - Complete guide to channel generation options and configuration
- **[AsyncAPI Input Documentation](/docs/inputs/asyncapi)** - Understanding AsyncAPI specifications for code generation
- **[E-commerce Channels Example](https://github.com/the-codegen-project/cli/tree/main/examples/ecommerce-asyncapi-channels)** - Complete working example from this blog post
- **[Payload Generator](https://github.com/the-codegen-project/cli/tree/main/examples/asyncapi-payload-generator)** - Generate type-safe payload models for message data
- **[Headers Generator](https://github.com/the-codegen-project/cli/tree/main/examples/asyncapi-headers-generator)** - Generate type-safe header models for message metadata
- **[Types Generator](https://github.com/the-codegen-project/cli/tree/main/examples/asyncapi-types-generator)** - Generate type definitions for compile-time safety
- **[NATS Protocol](/docs/protocols/nats)** - Using generated functions with NATS messaging
- **[Kafka Protocol](/docs/protocols/kafka)** - Using generated functions with Apache Kafka
- **[MQTT Protocol](/docs/protocols/mqtt)** - Using generated functions with MQTT messaging
- **[AMQP Protocol](/docs/protocols/amqp)** - Using generated functions with RabbitMQ and AMQP
- **[All Protocols](/docs/protocols)** - Browse all supported messaging protocols
