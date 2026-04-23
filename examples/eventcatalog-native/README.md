# EventCatalog Native Example

This example demonstrates the **proposed** EventCatalog integration where a service uses native EventCatalog events with JSON Schema (no AsyncAPI or OpenAPI specs).

> **Note**: This is a showcase of the proposed `inputType: 'eventcatalog'` configuration. This feature does not exist yet.

## Configuration

```javascript
// codegen.config.mjs
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  service: 'order-service',  // Service with sends/receives only
  language: 'typescript',
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' },
    { preset: 'channels', outputPath: './src/channels', protocols: ['nats'] },
    { preset: 'client', outputPath: './src/client', protocols: ['nats'] },
  ],
};
```

## How It Works

1. Read EventCatalog at `./eventcatalog`
2. Find `order-service` in `services/`
3. No `asyncapiPath` or `openapiPath` → use native processing
4. Read `sends: [OrderCreated, OrderShipped]` from service metadata
5. Load `schema.json` from each event
6. Generate code from JSON Schemas

## Service Metadata

The service's `index.md` declares which events it sends/receives:

```yaml
---
id: order-service
name: Order Service
version: 1.0.0
sends:
  - id: OrderCreated
    version: 1.0.0
  - id: OrderShipped
    version: 1.0.0
receives: []
# No asyncapiPath or openapiPath → native processing
---
```

## Project Structure

```
eventcatalog-native/
├── codegen.config.mjs
├── eventcatalog/
│   ├── eventcatalog.config.js
│   ├── domains/ecommerce/index.md
│   ├── services/
│   │   ├── order-service/index.md      # sends: [OrderCreated, OrderShipped]
│   │   └── inventory-service/index.md  # sends: [StockUpdated]
│   └── events/
│       ├── OrderCreated/
│       │   ├── index.md
│       │   └── schema.json             # JSON Schema for payload
│       ├── OrderShipped/
│       │   ├── index.md
│       │   └── schema.json
│       └── StockUpdated/
│           ├── index.md
│           └── schema.json
└── src/                                # Generated code
```

## Auto-Detection Logic

| Service Metadata | Processing |
|------------------|------------|
| `asyncapiPath: ...` | AsyncAPI processing |
| `openapiPath: ...` | OpenAPI processing |
| Neither (just `sends`/`receives`) | **Native JSON Schema** |

## Benefits of Native

- **No spec duplication** - EventCatalog is the source of truth
- **Simpler setup** - Just markdown + JSON Schema
- **Service-centric** - Events discovered from service relationships

## Related Examples

- [eventcatalog-asyncapi](../eventcatalog-asyncapi/) - Service with AsyncAPI spec
- [eventcatalog-openapi](../eventcatalog-openapi/) - Service with OpenAPI spec
