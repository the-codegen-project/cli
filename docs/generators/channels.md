---
sidebar_position: 99
---

# Channels

```js
export default {
  ...,
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/', 
      language: 'typescript',
      protocols: ['nats']
    }
  ]
};
```

`channels` preset with `asyncapi` input generates support functions for each operation based on the selected protocol.

This generator uses [`payloads`](./payloads.md), [`headers`](./headers.md) and [`parameters`](./parameters.md) generators, in case you dont have any defined, it will automatically include them with default values.

This is supported through the following inputs: [`asyncapi`](../inputs/asyncapi.md)

It supports the following languages; [`typescript`](#typescript)

It supports the following protocols; [`nats`](../protocols/nats.md), [`kafka`](../protocols/kafka.md), [`mqtt`](../protocols/mqtt.md), [`amqp`](../protocols/amqp.md), [`event_source`](../protocols/eventsource.md), [`http_client`](../protocols/http_client.md), [`websocket`](../protocols/websocket.md)

## Options
These are the available options for the `channels` generator; 

| **Option** | Default | Type | Description |
|---|---|---|---|
| asyncapiReverseOperations | `false` | Boolean | Used in conjunction with AsyncAPI input, and reverses the operation actions i.e. send becomes receive and receive becomes send. Often used in testing scenarios to act as the reverse API. |
| asyncapiGenerateForOperations | `true` | Boolean | Used in conjunction with AsyncAPI input, which if `true` generate the functions upholding how operations are defined. If `false` the functions are generated regardless of what operations define. I.e. `send` and `receive` does not matter. |
| functionTypeMapping | `{}` | Record\<String, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes)[]\> | Used in conjunction with AsyncAPI input, can define channel ID along side the type of functions that should be rendered. |
| kafkaTopicSeparator | `'.'` | String | Used with AsyncAPI to ensure the right character separate topics, example if address is my/resource/path it will be converted to my.resource.path |
| eventSourceDependency | `'@microsoft/fetch-event-source'` | String | Because @microsoft/fetch-event-source is out-dated in some areas we allow you to change the fork/variant that can be used instead |

## TypeScript
Regardless of protocol, these are the dependencies: 
- If validation enabled, [ajv](https://ajv.js.org/guide/getting-started.html): ^8.17.1
  
Depending on which protocol, these are the dependencies:
- `NATS`: https://github.com/nats-io/nats.js v2
- `Kafka`: https://github.com/tulios/kafkajs v2
- `MQTT`: https://github.com/mqttjs/MQTT.js v5
- `AMQP`: https://github.com/amqp-node/amqplib v0
- `EventSource`: `event_source_fetch`: https://github.com/Azure/fetch-event-source v2, `event_source_express`: https://github.com/expressjs/express v4
- `HTTP`: https://github.com/node-fetch/node-fetch v2
- `WebSocket`: https://github.com/websockets/ws v8

For TypeScript, the generator creates one file per protocol plus an index file that re-exports all protocols as namespaces. For example;

```ts
// Import specific functions from a protocol file
import {
  jetStreamPublishToSendUserSignedup,
  subscribeToReceiveUserSignedup,
  publishToSendUserSignedup
} from 'src/__gen__/nats';

// Or import the entire protocol namespace
import * as nats from 'src/__gen__/nats';

// Or import all protocols from the index
import { nats, kafka, mqtt, amqp, event_source } from 'src/__gen__/index';
```

The generated file structure is:
```
outputPath/
├── index.ts       # Re-exports all protocol namespaces
├── nats.ts        # NATS-specific functions
├── kafka.ts       # Kafka-specific functions
├── mqtt.ts        # MQTT-specific functions
├── amqp.ts        # AMQP-specific functions
├── event_source.ts # EventSource-specific functions
├── http_client.ts  # HTTP client-specific functions
└── websocket.ts   # WebSocket-specific functions
```

Each protocol file contains standalone exported functions for interacting with channels defined in your AsyncAPI document.
