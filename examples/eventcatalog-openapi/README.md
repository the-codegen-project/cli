# EventCatalog + OpenAPI Example

This example demonstrates the **proposed** EventCatalog integration where a service has an OpenAPI specification attached.

> **Note**: This is a showcase of the proposed `inputType: 'eventcatalog'` configuration. This feature does not exist yet.

## Configuration

```javascript
// codegen.config.mjs
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  service: 'petstore-api',  // Service with openapiPath
  language: 'typescript',
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' },
    { preset: 'channels', outputPath: './src/channels', protocols: ['http_client'] },
  ],
};
```

## How It Works

1. Read EventCatalog at `./eventcatalog`
2. Find `petstore-api` in `services/`
3. Detect `openapiPath: openapi.json` in service metadata
4. Load and parse the OpenAPI spec
5. Generate code using OpenAPI processing

## Service Metadata

The service's `index.md` declares its OpenAPI spec:

```yaml
---
id: petstore-api
name: Petstore API
version: 1.0.0
specifications:
  openapiPath: openapi.json  # <-- Auto-detected
---
```

## Project Structure

```
eventcatalog-openapi/
├── codegen.config.mjs
├── eventcatalog/
│   ├── eventcatalog.config.js
│   ├── domains/ecommerce-domain/index.md
│   └── services/petstore-api/
│       ├── index.md            # Has openapiPath in metadata
│       └── openapi.json        # OpenAPI 3.0 spec
└── src/                        # Generated code
```

## Auto-Detection Logic

| Service Metadata | Processing |
|------------------|------------|
| `asyncapiPath: ...` | AsyncAPI processing |
| `openapiPath: ...` | OpenAPI processing |
| Neither (just `sends`/`receives`) | Native JSON Schema |

## Related Examples

- [eventcatalog-asyncapi](../eventcatalog-asyncapi/) - Service with AsyncAPI spec
- [eventcatalog-native](../eventcatalog-native/) - Service with native JSON Schema events
