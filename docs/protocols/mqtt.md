---
sidebar_position: 99
---

# MQTT
`MQTT` is currently available through the generators ([channels](#channels)):

| **Languages** | publish | subscribe |
|---|---|---|
| TypeScript | ✅ | ✅ |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).

## ⚠️ Important: MQTT v5 Required for Headers

When using headers with MQTT, you MUST configure your MQTT client to use protocol version 5:

```typescript
// ✅ REQUIRED for header support
const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { 
  protocolVersion: 5 
});

// ❌ Will NOT work with headers (defaults to MQTT v3.1.1)
const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883");
```

**Why MQTT v5 is Required:**
- MQTT v3.1.1 (default) does not support user properties
- MQTT v5 introduces user properties which are used for header transmission
- Both publish and subscribe operations require MQTT v5 for full header functionality

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
// Location depends on the header generator configurations (if using headers)
import { UserSignedUpHeaders } from './__gen__/headers/UserSignedUpHeaders';
// Location depends on the channel generator configurations
import { Protocols } from './__gen__/channels';
const { mqtt } = Protocols;
const { publishToUserSignedup, subscribeToConsumeUserSignups } = mqtt;

/**
 * Setup the MQTT client with v5 protocol for header support
 */
const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { 
  protocolVersion: 5 // REQUIRED for headers
});

const myPayload = new UserSignedup({displayName: 'test', email: 'test@test.dk'});
const myHeaders = new UserSignedUpHeaders({ xTestHeader: 'my-header-value' });

// Subscribe to messages with the generated channel function
await subscribeToConsumeUserSignups({
  onDataCallback: (params) => {
    const { err, msg, headers, mqttMsg } = params;
    if (err) {
      console.error('Error receiving message:', err);
      return;
    }
    console.log('Received message:', msg);
    console.log('Received headers:', headers); // Available with MQTT v5
    console.log('Raw MQTT packet:', mqttMsg);
  },
  mqtt: client
});

// Publish messages with the generated channel function
await publishToUserSignedup({
  message: myPayload,
  headers: myHeaders, // Headers sent as MQTT v5 user properties
  mqtt: client
});
```	
</td>
  </tr>
</tbody>
</table>
