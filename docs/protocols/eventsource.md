---
sidebar_position: 99
---

# EventSource
[Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) is a web-based protocol (HTML5 EventSource API) for one-way streaming of updates from server to client over HTTP. SSE provides a simple way to push events to web browsers without the complexity of full bidirectional WebSockets. Server-Sent-Events is a technology for providing push data (notifications, content updates) from a server to a browser client in the form of DOM events​. 

This makes SSE ideal for applications like live dashboards, notifications, or any real-time feed where the client just needs to receive updates. The Codegen CLI supports SSE via its EventSource integration, generating TypeScript code for both server-side event broadcasters and client-side listeners​. 

You can define an AsyncAPI channel for an event stream, and the CLI will generate, for example, an Express.js route that clients can connect to for events, as well as client-side helper functions to listen for those events. This allows you to easily plug real-time browser updates into your project with type-safe code on each end.

`Event Source` is currently available through the generators ([channels](#channels)):

| **Languages** | [client](#client) | [server](#server) |
|---|---|---|
| TypeScript | ✔️ | ✔️ |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).

## Client

The client generated code is to listen for events from the server and act accordingly. 

## Server

The server generated code is to listen for clients making the connection and being ready to receive events. 

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
import express, { Router } from 'express'
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
  // Do stuff once you receive the event from the server
};
listenForUserSignedup(listenCallback, {baseUrl: 'http://localhost:3000'})

// Use express to listen for clients registering for events
const router = Router()
const app = express()
app.use(express.json({ limit: '3000kb' }))
app.use(express.urlencoded({ extended: true }))
registerSendUserSignedup(router, (req, res, next, parameters, sendEvent) => {
  //Do stuff when client starts listening to the event.
  //For example send a message to the client
  const testMessage = new UserSignedup({displayName: 'test', email: 'test@test.dk'});
  sendEvent(testMessage);
})
app.use(router)
app.listen(3000)
```
</td>
  </tr>
</tbody>
</table>
