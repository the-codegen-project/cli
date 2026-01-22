---
slug: update-3
title: The Codegen Project - 8 Months of Progress
authors: [jonaslagoni]
tags: [the-codegen-project]
---

# The Codegen Project: 8 Months of Progress (May 2025 - Jan 2026)

I am way to good at working in the shadows... Since our last update at `v0.39.0`, the project has grown substantially. Spanning versions `v0.40.0` through `v0.62.1` and brings **complete OpenAPI support**, a **powerful HTTP client support**, and an **MCP server for AI integration**.

**TLDR:**
- [MCP server to give AI assistants project context](/docs/ai-assistants)
- Full OpenAPI/Swagger support (payloads, parameters, headers, types, channels)
- Comprehensive HTTP client protocol with auth, OAuth2, pagination, retry, and hooks
- JSON Schema support (models and custom generators)
- Watch mode, WebSocket channels, and many more improvements...

<!-- truncate -->

## MCP Server for AI Integration

Perhaps the most exciting addition is the [MCP (Model Context Protocol) server](/docs/ai-assistants). This gives AI assistants like Claude, Cursor, and others deep context about The Codegen Project - its generators, protocols, configuration options, and best practices.

Why does this matter? Deterministic code generation and AI are complementary. The MCP server bridges these worlds by helping AI assistants create the right context for the task at hand.

This means you can ask your AI assistant to "set up NATS messaging from my AsyncAPI spec" and it will use The Codegen Project to generate consistent, tested code - then help you implement the business logic on top.

## Complete OpenAPI Support

The Codegen Project now fully supports [OpenAPI](/docs/inputs/openapi) (Swagger 2.0, OpenAPI 3.0, and 3.1) specifications:

```javascript
// codegen.config.mjs
export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  language: 'typescript',
  generators: [
    { preset: 'payloads', outputPath: './src/models' },
    { preset: 'parameters', outputPath: './src/params' },
    { preset: 'headers', outputPath: './src/headers' },
    { preset: 'types', outputPath: './src/types' },
    { preset: 'channels', outputPath: './src/api', protocols: ['http_client'] }
  ]
};
```

Most of the generators you know from [AsyncAPI](/docs/inputs/asyncapi) now work with OpenAPI - [payloads](/docs/generators/payloads) with validation, typed [parameters](/docs/generators/parameters) and [headers](/docs/generators/headers), and HTTP-specific [channel functions](/docs/generators/channels).

## HTTP Client Protocol Refactor

The [HTTP client protocol](/docs/protocols/http_client) received a major overhaul with enterprise-grade features:

**Authentication:**
- API Key (header, query, cookie)
- HTTP Basic/Bearer authentication
- OAuth2 flows (client credentials, password, implicit, authorization code)
- Automatic token refresh

**Resilience:**
- Configurable retry with exponential backoff
- Request/response hooks for logging, metrics, and custom logic
- Abort controller support for cancellation

**Pagination:**
- Cursor-based pagination
- Offset pagination
- Link-header pagination
- Automatic iteration helpers

```typescript
// Generated code with full type safety
const response = await getUsers({
  parameters: { page: 1, limit: 10 },
  auth: { type: 'bearer', token: 'your-token' },
  retry: { maxRetries: 3, backoffMs: 1000 }
});
```

## JSON Schema Input Processor

You can now generate models directly from [JSON Schema](/docs/inputs/jsonschema) files:

```javascript
export default {
  inputType: 'jsonschema',
  inputPath: './schema.json',
  language: 'typescript',
  generators: [
    { preset: 'models', outputPath: './src/models' }
  ]
};
```

This supports Draft-4, Draft-6, and Draft-7 specifications.

## Other Notable Improvements

**[Watch Mode](/docs/usage#codegen-generate-file)** - Automatically regenerate code when your spec changes:
```bash
codegen generate --watch
codegen generate --watch --watchPath ./specs
```

**[WebSocket Channels](/docs/protocols/websocket)** - Full WebSocket support with publish, subscribe, and register patterns for bidirectional messaging.

**[MQTT Subscribe](/docs/protocols/mqtt)** - Complete MQTT subscription functionality with QoS support.

**[Headers](/docs/generators/headers) Across Protocols** - [NATS](/docs/protocols/nats), [Kafka](/docs/protocols/kafka), MQTT, [AMQP](/docs/protocols/amqp), and WebSocket all now support typed headers when defined in your spec.

**[Types Generator](/docs/generators/types)** - Generate simple type definitions without full model classes.

**[Models Generator](/docs/generators/models)** - Generate complex data models using Modelina integration.

**[Telemetry](/docs/telemetry)** - Anonymous usage tracking to help improve the project (easily disabled via `CODEGEN_TELEMETRY_DISABLED=true`).

**Improved Channel Structure** - Protocol implementations are now split into separate files for better maintainability.

---

This release represents a significant expansion of The Codegen Project's capabilities. Whether you're working with AsyncAPI, OpenAPI, or JSON Schema - and whether you're building messaging systems or REST APIs - the tooling is now more comprehensive than ever.

The MCP server integration particularly excites us as it validates the vision: deterministic code generation and AI working together, each doing what they do best.

Give v0.62.1 a try, and let us know what you think!

Until next time, happy coding!
