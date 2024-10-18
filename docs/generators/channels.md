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

This is supported through the following inputs: [`asyncapi`](#inputs)

It supports the following languages; [`typescript`](#typescript)

It supports the following protocols; [`nats`](../protocols/nats.md)

## TypeScript

Depending on which protocol, these are the dependencies:
- `NATS`: https://github.com/nats-io/nats.js v2

For TypeScript what is generated is a single file that include functions to help easier interact with AsyncAPI channels. For example;

```ts
import { Protocols } from 'src/__gen__/index';
const { nats, ... } = Protocols;
const { jetStreamPublishTo..., jetStreamPullSubscribeTo..., jetStreamPushSubscriptionFrom..., publishTo..., subscribeTo... } = nats;
```

First we import the generated file, which is located based on your `outputPath` in the generator options. 

Next we import the desired protocol and then we have access to all the support functions. These support functions are an easy way to interact with channels defined in your AsyncAPI document. Take notice it does not care which operations you have defined.