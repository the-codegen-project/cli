# E-commerce Channel Types - Comprehensive Example

A comprehensive example showing how to generate type-safe channel routing from AsyncAPI specifications for an e-commerce event system. This example demonstrates all the patterns from the accompanying [blog post](https://the-codegen-project.org/blog/asyncapi-types-generator).

**Files:**
- `ecommerce-channels.yaml` - AsyncAPI specification defining event channels and routing
- `codegen.config.js` - Configuration for generating TypeScript channel types
- `src/index.ts` - Comprehensive demo showcasing all blog post examples

**Features demonstrated:**
- **Type-Safe Event Publisher** - Publish events with compile-time channel validation
- **Type-Safe Event Router** - Route events to handlers with type safety
- **Message Broker Integration** - Examples for NATS and Kafka
- **Environment-Specific Channel Mapping** - Add environment prefixes
- **Channel Health Monitoring** - Track publishing metrics and error rates
- **Parameter Substitution** - Dynamic channel addresses with entity IDs
- **Error Handling** - Runtime validation with proper error handling

**Usage:**
```bash
# Install dependencies
npm install

# Generate channel types from AsyncAPI spec
npm run generate

# Run the comprehensive demo showcasing all patterns
npm run demo
```

The generated types can be used with any messaging infrastructure (NATS, Kafka, RabbitMQ, etc.) while providing compile-time safety for channel routing.

## What Gets Generated

The types generator creates:

1. **TopicIds type** - Union type of all channel identifiers
2. **Topics type** - Union type of all channel address templates  
3. **ToTopics()** - Function to convert topic IDs to address templates
4. **ToTopicIds()** - Function to convert address templates back to IDs

## Example Generated Types

```typescript
export type TopicIds = 
  | 'order-events'
  | 'payment-events' 
  | 'inventory-events'
  | 'customer-notifications'
  | 'analytics-events';

export type Topics = 
  | 'ecommerce.orders.{orderId}'
  | 'ecommerce.payments.{paymentId}'
  | 'ecommerce.inventory.{productId}'
  | 'ecommerce.notifications.{customerId}'
  | 'ecommerce.analytics.events';

export function ToTopics(topicId: TopicIds): Topics {
  // Implementation with switch statement...
}

export function ToTopicIds(topic: Topics): TopicIds {
  // Implementation with switch statement...
}
```

## Comprehensive Demo Examples

The `src/index.ts` file demonstrates:

### 1. Type-Safe Event Publisher
```typescript
const publisher = new EventPublisher(messagingClient);
await publisher.publish('order-events', orderData, { orderId: '123' });
```

### 2. Type-Safe Event Router
```typescript
const router = new EventRouter();
router.register('order-events', async (data) => {
  console.log('Processing order:', data);
});
```

### 3. Message Broker Integration
- **NATS Integration**: Subscribe and publish with channel templates
- **Kafka Integration**: Map channel IDs to Kafka topics

### 4. Environment-Specific Publishing
```typescript
const envPublisher = new EnvironmentAwarePublisher(client);
// Publishes to: dev.ecommerce.orders.123 (in development)
await envPublisher.publish('order-events', data, { orderId: '123' });
```

### 5. Channel Health Monitoring
```typescript
const monitor = new ChannelMonitor();
monitor.recordPublish('order-events');
const healthReport = monitor.getHealthReport(); // Get metrics
```

## Benefits

- **Compile-time safety**: TypeScript catches channel name errors before runtime
- **IDE support**: Full autocomplete for channel names and IntelliSense
- **Refactoring safety**: Renaming channels in spec updates all usage automatically
- **Documentation**: Types serve as living documentation of your event architecture
- **Consistency**: Enforces consistent channel naming across your application
- **Production-ready patterns**: Real-world examples for enterprise applications
- **Error prevention**: Eliminates typos and routing errors that cause silent failures

## Related Resources

- **[Blog Post](https://the-codegen-project.org/blog/asyncapi-types-generator)** - Detailed explanation of patterns and benefits
- **[Types Generator Documentation](https://the-codegen-project.org/docs/generators/types)** - Complete configuration guide
- **[AsyncAPI Input Documentation](https://the-codegen-project.org/docs/inputs/asyncapi)** - AsyncAPI specification details
