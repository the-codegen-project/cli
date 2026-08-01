---
paths:
  - "src/codegen/generators/typescript/channels/**/*.ts"
---

# Protocol Implementation Rules

## Supported Protocols

NATS, Kafka, MQTT, AMQP, EventSource, HTTP Client, HTTP Server, WebSocket

HTTP Client and HTTP Server both live under `protocols/http/`. HTTP Server is
OpenAPI-only and generates Express handler stubs — the structural inverse of the
client.

## File Structure Per Protocol

```
protocols/[protocol]/
├── index.ts       # Main handler
├── publish.ts     # Publish operation
├── subscribe.ts   # Subscribe operation
├── request.ts     # Request (if applicable)
├── reply.ts       # Reply (if applicable)
└── utils.ts       # Utilities
```

## Object Parameters (MANDATORY)

```typescript
// All functions
export async function publish({message, parameters, headers, client}: {
  message: MessageType; parameters?: ParametersType;
  headers?: HeadersType; client: ClientType;
}): Promise<void> { }

// All callbacks
onDataCallback: (params: {
  err?: Error; msg?: MessageType; parameters?: ParametersType;
  headers?: HeadersType; protocolMsg?: ProtocolMessageType;
}) => void
```

## Function Type Registration

Add to `ChannelFunctionTypes` enum in channel types. Add subscribe types to `receivingFunctionTypes` array.

## Protocol-Specific Header Handling

**NATS**: `msg.headers.keys()` iteration
**Kafka**: `Object.entries(message.headers)` with `value?.toString()`
**AMQP**: `msg.properties.headers` with `HeaderType.unmarshal()`
**MQTT** (CRITICAL - requires v5):
- Connect with `{ protocolVersion: 5 }` for header support
- Publish: `publishOptions.properties.userProperties`
- Subscribe: `packet.properties.userProperties` with `HeaderType.unmarshal()`
- MUST filter topics: `if (!topicPattern.test(topic)) return;`
