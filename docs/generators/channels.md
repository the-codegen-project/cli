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

This generator uses `payloads` and `parameters` generators, in case you dont have any defined, it will automatically include them with default values.

This is supported through the following inputs: [`asyncapi`](../inputs/asyncapi.md)

It supports the following languages; [`typescript`](#typescript)

It supports the following protocols; [`nats`](../protocols/nats.md), [`kafka`](../protocols/kafka.md), [`mqtt`](../protocols/mqtt.md), [`amqp`](../protocols/amqp.md)

## Options
These are the available options for the `channels` generator; 

| **Option** | Default | Type | Description |
|---|---|---|
| asyncapiReverseOperations | `false` | Boolean | Used in conjunction with AsyncAPI input, and reverses the operation actions i.e. send becomes receive and receive becomes send. Often used in testing scenarios to act as the reverse API. |
| asyncapiGenerateForOperations | `true` | Boolean | Used in conjunction with AsyncAPI input, which if `true` generate the functions upholding how operations are defined. If `false` the functions are generated regardless of what operations define. I.e. `send` and `receive` does not matter. |
| functionTypeMapping | {} | Record\<string, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes.md)[]\> | Used in conjunction with AsyncAPI input, can define channel ID along side the type of functions that should be rendered. |

## TypeScript

Depending on which protocol, these are the dependencies:
- `NATS`: https://github.com/nats-io/nats.js v2
- `Kafka`: https://github.com/tulios/kafkajs v2
- `MQTT`: https://github.com/mqttjs/MQTT.js v5
- `AMQP`: https://github.com/amqp-node/amqplib v0

For TypeScript what is generated is a single file that include functions to help easier interact with AsyncAPI channels. For example;

```ts
import { Protocols } from 'src/__gen__/index';
const { nats, kafka, mqtt, amqp ... } = Protocols;
const { jetStreamPublishTo..., jetStreamPullSubscribeTo..., jetStreamPushSubscriptionFrom..., publishTo..., subscribeTo... } = nats;
```

First we import the generated file, which is located based on your `outputPath` in the generator options. 

Next we import the desired protocol and then we have access to all the support functions. These support functions are an easy way to interact with channels defined in your AsyncAPI document. Take notice it does not care which operations you have defined.