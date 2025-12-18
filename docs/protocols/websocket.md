---
sidebar_position: 99
---

# WebSocket

WebSocket is currently supported through the following generators ([channels](#channels)):

| **Languages** | Client Publish | Client Subscribe | Server Register |
|---|---|---|---|
| TypeScript | ✅ | ✅ | ✅ |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).

## ⚠️ Important: External Connection Management

The WebSocket generator assumes that WebSocket connections are managed externally by your application. The generated functions accept already-connected WebSocket instances and focus on message handling rather than connection establishment.

```typescript
// ✅ You manage the connection
const clientWs = new WebSocket('ws://localhost:8080/user/events');
const server = new WebSocketServer({ port: 8080 });

// ✅ Generated functions use your connections
await publishMessage({ message, parameters, ws: clientWs });
registerHandler({ wss: server, onConnection, onMessage });
```

**Why External Connection Management:**
- Gives you full control over connection lifecycle
- Allows custom authentication and authorization
- Enables connection pooling and reconnection strategies
- Separates transport concerns from message handling

## Channels

Read more about the [channels](../generators/channels.md) generator here before continuing.

This generator provides support functions for each resource ensuring you use the right payload and parameters.

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
  title: User Service
  version: 1.0.0
  description: WebSocket-based user event system
channels:
  userEvents:
    address: user/events/{userId}
    parameters:
      userId:
        description: The user identifier
    messages:
      userSignedUp:
        $ref: '#/components/messages/UserSignedUp'
operations:
  sendUserEvent:
    action: send
    channel:
      $ref: '#/channels/userEvents'
  receiveUserEvent:
    action: receive
    channel:
      $ref: '#/channels/userEvents'
components:
  messages:
    UserSignedUp:
      payload:
        type: object
        properties:
          userId:
            type: string
          email:
            type: string
        required:
          - userId
          - email
```

</td>
<td>

**Client-side publishing:**
```typescript
import { publishToSendUserEvent } from './channels';
import { UserSignedUp } from './payloads';
import { UserEventsParameters } from './parameters';
import WebSocket from 'ws';

// Create connection (your responsibility)
const ws = new WebSocket('ws://localhost:8080/user/events/user123');

await ws.on('open', async () => {
  // Use generated publish function
  await publishToSendUserEvent({
    message: new UserSignedUp({
      userId: 'user123',
      email: 'user@example.com'
    }),
    parameters: new UserEventsParameters({
      userId: 'user123'
    }),
    ws
  });
});
```

**Client-side subscribing:**
```typescript
import { subscribeToReceiveUserEvent } from './channels';

ws.on('open', () => {
  // Set up subscription
  subscribeToReceiveUserEvent({
    onDataCallback: (params) => {
      const { err, msg, parameters, ws } = params;
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('Received:', msg?.marshal());
      console.log('User ID:', parameters?.userId);
    },
    parameters: new UserEventsParameters({
      userId: 'user123'
    }),
    ws
  });
});
```

**Server-side handling:**
```typescript
import { registerSendUserEvent } from './channels';
import WebSocket from 'ws';

// Create server (your responsibility)
const wss = new WebSocket.WebSocketServer({ port: 8080 });

// Register message handler
registerSendUserEvent({
  wss,
  onConnection: (params) => {
    const { parameters, ws, request } = params;
    console.log(`User ${parameters.userId} connected`);
    
    // Perform authentication, logging, etc.
  },
  onMessage: (params) => {
    const { message, ws } = params;
    console.log('Received message:', message.marshal());
    
    // Process the message
    // Send response if needed
    const response = new UserSignedUp({
      userId: message.userId,
      email: 'updated@example.com'
    });
    ws.send(response.marshal());
  }
});
```

</td>
</tr>
</tbody>
</table>

## Function Types

The WebSocket generator creates three types of functions:

### Client Functions

**Publish Functions** (`publishTo*`):
- Send messages from client to server
- Require connected WebSocket instance
- Handle message serialization automatically
- Return Promise for async operation

**Subscribe Functions** (`subscribeTo*`):
- Listen for messages from server
- Set up message handlers on WebSocket
- Handle message parsing and validation
- Support error handling through callbacks

### Server Functions

**Register Functions** (`register*`):
- Handle incoming client connections
- Process messages from clients
- Support both connection and message callbacks
- Enable URL parameter extraction

## URL Pattern Matching

The WebSocket generator automatically creates URL pattern matching for channels with parameters:

```yaml
# AsyncAPI Channel
channels:
  userEvents:
    address: user/events/{userId}/{eventType}
```

```typescript
// Generated pattern matching
// Matches: /user/events/123/signup
// Extracts: userId="123", eventType="signup"

registerSendUserEvent({
  wss,
  onConnection: (params) => {
    // Parameters automatically extracted from URL
    const { parameters } = params;
    console.log(parameters.userId);    // "123"
    console.log(parameters.eventType); // "signup"
  },
  onMessage: (params) => {
    // Handle the message
  }
});
```

## Error Handling

The WebSocket generator includes comprehensive error handling:

```typescript
// Client-side error handling
subscribeToReceiveUserEvent({
  onDataCallback: (params) => {
    const { err, msg } = params;
    if (err) {
      // Handle parsing errors, validation errors, etc.
      console.error('Message error:', err.message);
      return;
    }
    // Process successful message
  },
  ws
});

// Connection state checking
await publishToSendUserEvent({
  message,
  parameters,
  ws // Function checks if WebSocket is open
});
```

## Best Practices

### Connection Management
```typescript
// ✅ Handle connection lifecycle
const ws = new WebSocket('ws://localhost:8080/user/events/123');

ws.on('open', () => {
  // Set up subscriptions after connection opens
  subscribeToReceiveUserEvent({ ... });
});

ws.on('close', (code, reason) => {
  // Handle disconnection, implement reconnection logic
});

ws.on('error', (error) => {
  // Handle connection errors
});
```

### Message Validation
```typescript
// ✅ Use validation in production
subscribeToReceiveUserEvent({
  onDataCallback: (params) => {
    const { err, msg } = params;
    if (err) {
      // Generated functions include validation errors
      console.error('Invalid message received:', err);
      return;
    }
    // Message is guaranteed to be valid
  },
  skipMessageValidation: false, // Enable validation (default)
  ws
});
```

### Server Setup
```typescript
// ✅ Proper server setup with error handling
const wss = new WebSocket.WebSocketServer({ 
  port: 8080,
  verifyClient: (info) => {
    // Implement authentication logic
    return true;
  }
});

registerSendUserEvent({
  wss,
  onConnection: (params) => {
    const { parameters, ws, request } = params;
    
    // Validate parameters
    if (!parameters.userId) {
      ws.close(1008, 'Invalid user ID');
      return;
    }
    
    // Set up user session
  },
  onMessage: (params) => {
    const { message, ws } = params;
    
    try {
      // Process message safely
    } catch (error) {
      ws.close(1011, 'Processing error');
    }
  }
});
```

## Dependencies

The generated WebSocket code requires the `ws` library:

```bash
npm install ws
npm install @types/ws  # For TypeScript projects
```