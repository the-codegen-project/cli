---
sidebar_position: 99
---

# EventSource
`Event Source` is currently available through the generators ([channels](#channels)):

| **Languages** | [client](#client) | server |
|---|---|---|
| TypeScript | ✔️ |  |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).

## Client

The client generated code is to listen for events from the server and act accordingly. It currently supports 

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
// Location depends on the payload generator configurations
import { UserSignedup } from './__gen__/payloads/UserSignedup';
// Location depends on the channel generator configurations
import { Protocols } from './__gen__/channels';
const { event_source_client } = Protocols;
const { listenForUserSignedup } = event_source_client;
const listenCallback = async (
  messageEvent: UserSignedUp | null, 
  parameters: UserSignedUpParameters | null,
  error?: string
) => {
  // Do stuff once you receive the event
};
listenForUserSignedup(listenCallback, {baseUrl: 'http://localhost:3000'})
```	
</td>
  </tr>
</tbody>
</table>
