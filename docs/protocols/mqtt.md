---
sidebar_position: 99
---

# MQTT
`MQTT` is currently available through the generators ([channels](#channels)):

| **Languages** | publish | subscribe |
|---|---|---|
| TypeScript | ✔️ |  |

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
import * as MqttClient from 'mqtt';
// Location depends on the payload generator configurations
import { UserSignedup } from './__gen__/payloads/UserSignedup';
// Location depends on the channel generator configurations
import { Protocols } from './__gen__/channels';
const { mqtt } = Protocols;
const { publishToUserSignedup } = mqtt;

/**
 * Setup the regular client
 */
const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883");

const myPayload = new UserSignedup({displayName: 'test', email: 'test@test.dk'});
const myParameters = new UserSignedUpParameters({userId: 'test'});

// Produce the messages with the generated channel function
const producer = await publishToUserSignedup(myPayload, myParameters, kafkaClient);
```	
</td>
  </tr>
</tbody>
</table>