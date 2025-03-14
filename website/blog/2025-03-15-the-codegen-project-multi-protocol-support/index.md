---
slug: the-codegen-project-multi-protocol-support
title: The Codegen CLI’s Multi-Protocol Support
authors: [jonaslagoni]
tags: [the-codegen-project]
---

# The Codegen Project Multi-Protocol Support

Developers today face a landscape of **diverse messaging technologies** – from lightweight IoT protocols to enterprise message queues. An implemenation most likely will touch multiple at the same time. This is the core reason the project exist so regardless of protocol, you have a great developer experience when implementing your application. In this post, we’ll provide an overview of the CLI’s supported messaging protocols compare their features, strengths, and use cases, show side-by-side code examples. By the end, you’ll see how this multi-protocol support can benefit a wide range of your projects.

## Supported Messaging Protocols Overview

The Codegen CLI embraces several popular messaging protocols, each suited to different scenarios. Under the hood, the CLI leverages **AsyncAPI** specifications as input, so you can define your event-driven APIs once and generate code for any supported protocol. Currently the CLI supportes NATS, Kafka, MQTT, AMQP, and SSE.

Each protocol excels in different aspects. For instance, NATS is built for **speed and simplicity**, making it great for cases where minimal latency is a must. RabbitMQ’s AMQP model shines in **complex routing and reliability**, which is why it’s common in enterprise systems that require guaranteed delivery and flexible message flow control. Kafka, with its distributed log design, is unparalleled for **high-volume data streaming** and retention – perfect for analytics pipelines or integrating multiple microservices through an event log. MQTT is purpose-made for **constrained environments**, so it’s the go-to for IoT devices sending telemetry or receiving commands reliably over spotty connections. SSE, while quite different from the others, leverages the ubiquity of HTTP to deliver **real-time updates to web clients** with minimal setup – great for pushing events to browsers without needing a complex protocol or additional libraries on the client side.

The platform we are building around the CLI (TBA) uses a mix between NATS and SSE, built with and ontop of the CLI. But, more on that later.

More importantly, with CLI no matter which protocol you choose or use, with it will provide you with a consistent project structure and coding patterns with an abstraction that allows development teams to focus on application logic and let the generator handle most of the protocol intricacies.

**Unified AsyncAPI Input:** It’s worth noting that all the above protocol integrations are driven by a single source of truth – your AsyncAPI definition. You describe your channels, messages, and operations once, and then select the appropriate protocol generator. The CLI ensures the generated code uses the correct underlying libraries and patterns for that protocol, while you work with a *consistent, high-level API*. This unification is a major benefit: you could even switch messaging systems (say from MQTT to Kafka) by just changing the generator, rather than rewriting your application logic. The ability to target multiple protocols with the same toolchain significantly **future-proofs** your project – if requirements change or you need to integrate with another system, The Codegen Project has you covered.

## Side-by-Side Code Examples (Kafka vs. AMQP)

To see the multi-protocol support in action, let’s compare code snippets for two different messaging systems. Below are simplified examples of **generated TypeScript code** for Apache Kafka and RabbitMQ (AMQP) based on the same AsyncAPI-defined message (e.g., a `UserSignedUp` event). Even though the protocols differ, notice how the usage pattern remains similar:

<table>
<tr>
  <td><strong>Kafka (TypeScript)</strong></td>
</tr>
<tr>
  <td>

```ts
import { Kafka } from 'kafkajs';
import { Protocols } from './__gen__/channels';
const { kafka } = Protocols;
const { consumeFromUserSignups, produceToUserSignups } = kafka;

// Setup Kafka client
const kafkaClient = new Kafka({ clientId: 'myApp', brokers: ['localhost:9092'] });

// Consume messages from a topic
const consumer = await consumeFromUserSignups(myCallback, myParams, kafkaClient, {
  fromBeginning: true,
  groupId: 'group1'
});

// Produce a message to the topic
await produceToUserSignups(myPayload, kafkaClient);
``` 

  </td>
</tr>
<tr>
  <td><strong>RabbitMQ (TypeScript)</strong></td>
</tr>
<tr>
  <td>

```ts
import * as Amqp from 'amqplib';
import { Protocols } from './__gen__/channels';
const { amqp } = Protocols;
const { publishToUserSignupsExchange, subscribeToUserSignupsQueue } = amqp;

// Connect to RabbitMQ broker
const client = await Amqp.connect('amqp://localhost');

// Subscribe to a queue for messages
await subscribeToUserSignupsQueue(msg => {
  console.log(`Received: ${msg.displayName}, ${msg.email}`);
}, client);

// Publish a message to an exchange
await publishToUserSignupsExchange(myPayload, client);

``` 

  </td>
</tr>
</table>

In the Kafka example (left), the CLI-generated helpers `produceToUserSignups` and `consumeFromUserSignups` abstract the details of producing to and consuming from a Kafka topic. In the RabbitMQ example (right), similar helpers (`publishTo...Exchange` and `subscribeTo...Queue`) abstract publishing to an exchange and consuming from a queue. The **structure of the code is comparable**, despite using completely different messaging systems. This consistency is a huge win for developers: once you learn how the Codegen CLI organizes generated code for one protocol, you can easily apply it to another.

Both snippets handle establishing a connection (`Kafka(...)` or `Amqp.connect(...)`), then use the protocol-specific helpers from the `Protocols` module to send/receive messages. The heavy lifting of setting up consumers, producers, binding to topics or queues, and ensuring the message payloads conform to the spec is all taken care of by the generated code. Notably, the CLI integrates with well-known client libraries for each protocol – for example, it uses **Kafkajs for Kafka** and **amqplib for AMQP** (as seen in the imports) – so the generated code builds on proven foundations.

The benefit is clear: you can work at a higher abstraction level and trust that under the hood, the optimal patterns for each protocol are implemented correctly. Whether you’re dealing with Kafka’s partitioned topics or RabbitMQ’s exchanges and queues, the CLI presents a clean interface for your application.

## Conclusion

Supporting multiple messaging protocols in one CLI tool brings significant benefits for teams working on diverse projects. You might start with RabbitMQ for a simple task queue, and later introduce Kafka for an analytics pipeline – The Codegen CLI can accommodate both, ensuring you get **consistent, tested code generation** for each integration. By referencing a single AsyncAPI specification, you can generate producers/consumers for NATS, AMQP, Kafka, MQTT, or SSE, all in a similar fashion. This not only speeds up development (no need to hand-write boilerplate for each client library) but also reduces errors, as the generated code is built and tested against each protocol’s best practices.

In addition to the technical advantages, having multi-protocol support means you have the **freedom to choose the right tool for the job**. Need ultra-fast transient messaging? Use NATS. Need persistent event streaming? Use Kafka. The CLI won’t lock you in or limit you to one choice – it’s built to integrate into *your* architecture, whatever that may be.

Finally, getting started is straightforward. To try out The Codegen CLI’s multi-protocol support, check out the **installation and setup guide** in the official docs. The guide will walk you through installing the CLI and generating your first project step-by-step – you can find it here: **[Getting Started with The Codegen Project CLI](https://the-codegen-project.org/docs/getting-started)**. With a few commands, you’ll be able to scaffold a publisher/subscriber in your protocol of choice and see first-hand how the CLI simplifies integration with messaging systems.

**Empower your development** by leveraging a tool that evolves with your needs. Whether you’re building a real-time IoT network, a robust enterprise system, or anything in between, The Codegen CLI’s support for multiple messaging protocols will help ensure your project is ready for whatever comes next.

