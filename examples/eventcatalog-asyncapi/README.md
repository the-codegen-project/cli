# EventCatalog + AsyncAPI Example

This example demonstrates the **proposed** EventCatalog integration where a service has an AsyncAPI specification attached.

> **Note**: This is a showcase of the proposed `inputType: 'eventcatalog'` configuration. This feature does not exist yet.

## Configuration

```javascript
// codegen.config.mjs
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  service: 'user-service',  // Service with asyncapiPath
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
2. Find `user-service` in `services/`
3. Detect `asyncapiPath: asyncapi.yaml` in service metadata
4. Load and parse the AsyncAPI spec
5. Generate code using AsyncAPI processing

## Service Metadata

The service's `index.md` declares its AsyncAPI spec:

```yaml
---
id: user-service
name: User Service
version: 1.0.0
specifications:
  asyncapiPath: asyncapi.yaml  # <-- Auto-detected
---
```

## Project Structure

```
eventcatalog-asyncapi/
├── codegen.config.mjs
├── eventcatalog/
│   ├── eventcatalog.config.js
│   ├── domains/user-domain/index.md
│   ├── services/user-service/
│   │   ├── index.md            # Has asyncapiPath in metadata
│   │   └── asyncapi.yaml       # AsyncAPI 3.0 spec
│   └── events/UserSignedUp/index.md
└── src/                        # Generated code
```

## Auto-Detection Logic

| Service Metadata | Processing |
|------------------|------------|
| `asyncapiPath: ...` | AsyncAPI processing |
| `openapiPath: ...` | OpenAPI processing |
| Neither (just `sends`/`receives`) | Native JSON Schema |

## Related Examples

- [eventcatalog-openapi](../eventcatalog-openapi/) - Service with OpenAPI spec
- [eventcatalog-native](../eventcatalog-native/) - Service with native JSON Schema events
