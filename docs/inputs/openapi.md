---
sidebar_position: 99
---

# OpenAPI

Input support; `openapi`

- OpenAPI 3.0.x
- OpenAPI 3.1.x
- OpenAPI 2.0.0 (Swagger)

| **Presets** | OpenAPI | 
|---|---|
| [`payloads`](../generators/payloads.md) | ✅ |
| [`parameters`](../generators/parameters.md) | ✅ |
| [`headers`](../generators/headers.md) | ✅ |
| [`types`](../generators/types.md) | ✅ |
| [`channels`](../generators/channels.md) | ❌ |
| [`client`](../generators/client.md) | ❌ |
| [`custom`](../generators/custom.md) | ✅ |
| [`models`](../generators/custom.md) | ✅ |

## Basic Usage

### Configuration

Create a configuration file that specifies OpenAPI as the input type:

```json
{
  "inputType": "openapi",
  "inputPath": "./api/openapi.yaml",
  "language": "typescript",
  "generators": [ ... ]
}
```

## Advanced Features

### External References

The OpenAPI parser automatically resolves external `$ref` references:

```yaml
components:
  schemas:
    Pet:
      $ref: './schemas/pet.yaml#/Pet'
    User:
      $ref: 'https://api.example.com/schemas/user.json#/User'
```

### OpenAPI 3.1 Features

Full support for OpenAPI 3.1 features including:

- JSON Schema 2020-12 compatibility
- `const` keyword
- `if`/`then`/`else` conditionals
- Enhanced `examples` support

## Troubleshooting

## FAQ

### Can I use both OpenAPI and AsyncAPI in the same project?

Yes! You can have separate configuration files for each input type and generate code to different output directories.

### Can I customize the generated code?

Yes, use the [custom generator](../generators/custom) preset to create your own generation logic. 