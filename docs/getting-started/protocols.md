---
sidebar_position: 4
---

# Understanding Protocols

The Codegen Project supports multiple messaging protocols, allowing you to generate protocol-specific code for your message-driven applications. This enables type-safe, production-ready communication code for various messaging systems.

## What Are Protocols?

Protocols define how messages are sent and received in distributed systems. The Codegen Project generates protocol-specific functions that handle the low-level details of message communication, so you can focus on your business logic.

## Supported Protocols

The Codegen Project currently supports these messaging protocols:

| Protocol | Description | Use Cases |
|----------|-------------|-----------|
| **[NATS](../protocols/nats.md)** | High-performance, cloud-native messaging system | Microservices, real-time systems, IoT |
| **[Kafka](../protocols/kafka.md)** | Distributed event streaming platform | Event streaming, log aggregation, real-time analytics |
| **[MQTT](../protocols/mqtt.md)** | Lightweight messaging protocol for IoT | IoT devices, mobile apps, low-bandwidth scenarios |
| **[AMQP](../protocols/amqp.md)** | Advanced Message Queuing Protocol | Enterprise messaging, reliable message delivery |
| **[EventSource](../protocols/eventsource.md)** | Server-Sent Events (SSE) protocol | Real-time web updates, streaming data to browsers |
| **[HTTP Client](../protocols/http_client.md)** | RESTful API communication | HTTP APIs, REST services |
| **[WebSocket](../protocols/websocket.md)** | Full-duplex communication protocol | Real-time web applications, bidirectional communication |

## How Protocol Support Works
Each protocol usually requires specific dependencies and should be installed in your project (if its noy already are). Make sure to check the documentation for each protocol to figure out which one you need!

### 1. Protocol Configuration

Protocols are configured through the [`channels`](../generators/channels.md) generator:

```js
export default {
  inputType: 'asyncapi',
  inputPath: './my-api.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/',
      language: 'typescript',
      protocols: ['nats', 'kafka'] // Specify which protocols to generate
    }
  ]
};
```

### 2. Generated Protocol Functions

The `channels` generator creates protocol-specific functions for each channel in your AsyncAPI specification:

```typescript
import { Protocols } from './src/__gen__/index';

const { nats, kafka } = Protocols;

// NATS functions
await nats.publishToUserSignup(connection, message);
await nats.subscribeToUserSignup(connection, callback);

// Kafka functions
await kafka.publishToUserSignup(producer, message);
await kafka.subscribeToUserSignup(consumer, callback);
```

Each protocol has unique features that are reflected in the generated code:

**NATS** supports:
- Core publish/subscribe
- JetStream (persistent messaging)
- Request/reply patterns

**Kafka** supports:
- Producer/consumer patterns
- Consumer groups
- Topic partitioning

**MQTT** supports:
- QoS levels (0, 1, 2)
- Retained messages
- User properties (headers)

**AMQP** supports:
- Exchanges and queues
- Routing patterns
- Message acknowledgments

## Protocol Selection

### Single Protocol
Generate code for one protocol:

```js
{
  preset: 'channels',
  protocols: ['nats']
}
```
or generate for multiple protocols at once:

```js
{
  preset: 'channels',
  protocols: ['nats', 'kafka', 'mqtt']
}
```


## Protocol-Specific Options

Some generators support protocol-specific configuration options:

```js
{
  preset: 'channels',
  protocols: ['kafka'],
  kafkaTopicSeparator: '.', // Customize topic separator
  eventSourceDependency: '@microsoft/fetch-event-source' // Custom EventSource dependency
}
```

## Generated Code Structure

Protocol functions are organized by protocol:

```typescript
export const Protocols = {
  nats: {
    publishToUserSignup: ...,
    subscribeToUserSignup: ...,
    jetStreamPublishToUserSignup: ...
  },
  kafka: {
    publishToUserSignup: ...,
    subscribeToUserSignup: ...
  },
  // ... other protocols
};
```

## Next Steps

- **[Explore Protocol Documentation](../protocols/)** - Detailed docs for each protocol
- **[Learn about Channels Generator](../generators/channels.md)** - How to configure protocol generation
- **[Check Out Examples](../../examples/)** - See the code generation in action
- **[Understanding Generators](./generators.md)** - Learn how generators work

