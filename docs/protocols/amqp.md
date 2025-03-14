---
sidebar_position: 99
---

# AMQP
[AMQP (Advanced Message Queuing Protocol)](https://www.amqp.org/) is a widely-used open standard for messaging, and its most famous implementation is RabbitMQ. RabbitMQ is known as a highly reliable, open-source message broker that enables stable asynchronous communication via a brokered queue model​. AMQP’s model involves producers, exchanges, queues, and consumers – offering flexible routing (direct, fanout, topic, headers) and reliable delivery with acknowledgments. 

The Codegen CLI supports AMQP by generating helper functions for publishing to exchanges or queues and subscribing to queues, all based on your AsyncAPI spec​. This means you can decouple services with RabbitMQ’s robust routing, while the CLI handles the boilerplate of connecting, sending, and receiving messages.

`AMQP` is currently available through the generators ([channels](#channels)):

| **Languages** | Publish exchange | Publish queue | Subscribe |
|---|---|---|---|
| TypeScript | ✔️ | ✔️ |  |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).

## Channels
Read more about the [channels](../generators/channels.md) generator here before continuing.

This generator provides support functions for each resource ensuring you the right payload and parameter are used. 

<table>
<thead>
  <tr>
    <th>Input (AsyncAPI)</th>
    <th>Using the code</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>

```yaml
asyncapi: 3.0.0
info:
  title: Account Service
  version: 1.0.0
  description: This service is in charge of processing user signups
channels:
  userSignups:
    address: user/signedup
    messages:
      userSignedup:
        $ref: '#/components/messages/UserSignedUp'
operations:
  publishUserSignups:
    action: send
    channel:
      $ref: '#/channels/userSignups'
  consumeUserSignups:
    action: receive
    channel:
      $ref: '#/channels/userSignups'
components:
  messages:
    UserSignedUp:
      payload:
        type: object
        properties:
          displayName:
            type: string
            description: Name of the user
          email:
            type: string
            format: email
            description: Email of the user

```
</td>
    <td>

```ts
import * as Amqp from 'amqplib';
// Location depends on the payload generator configurations
import { UserSignedup } from './__gen__/payloads/UserSignedup';
// Location depends on the channel generator configurations
import { Protocols } from './__gen__/channels';
const { amqp } = Protocols;
const { publishToPublishUserSignupsExchange, publishToPublishUserSignupsQueue } = amqp;

/**
 * Setup the regular client
 */
const client = await amqplib.connect('amqp://localhost');

const myPayload = new UserSignedup({displayName: 'test', email: 'test@test.dk'});
// Produce the messages with the generated channel function
await publishToPublishUserSignupsExchange(myPayload, client);
await publishToPublishUserSignupsQueue(myPayload, client);
```	
</td>
  </tr>
</tbody>
</table>