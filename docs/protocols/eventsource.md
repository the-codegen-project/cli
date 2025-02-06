---
sidebar_position: 99
---

# EventSource
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





const ensureAccessToRun = ({listenParameter, req, res, context}) => {
  try {
    await database.run.findFirstOrThrow({
      where: {
        id: runId,
        generationEntity: {
          documentInstance: {
            project: {
              projectMembers: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
const registerUserSignedup = (
  callback: (req, res, next, parameters) => void | (req, res, next, parameters) => Promise<void>
) => {
  const runId = listenParameter.run_id

  router.get('/events/run/logs/:run_id', async (req, res, next) => {
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    await callback(parameters, req, rest, next)
  })
}
```
</td>
  </tr>
</tbody>
</table>
