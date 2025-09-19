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

### Validation and Error Handling

The parser provides detailed validation errors:

```typescript
// If validation fails, you'll get detailed error information
try {
  const document = await loadOpenapi(context);
} catch (error) {
  console.error('OpenAPI validation failed:', error.message);
  // Error message includes line numbers and specific validation issues
}
```

## Examples

### REST API Client Generation

Generate a complete TypeScript client for your REST API:

```json
{
  "inputType": "openapi",
  "inputPath": "./api/openapi.yaml",
  "language": "typescript",
  "generators": [ ]
}
```

## Best Practices

1. **Schema Organization**: Use `$ref` to organize complex schemas into separate files
2. **Validation**: Always validate your OpenAPI documents before generation
3. **Versioning**: Include version information in your API specifications
4. **Documentation**: Use `description` fields extensively for better generated code
5. **Examples**: Provide examples in your schemas for better understanding

## Troubleshooting

### Common Issues

1. **Invalid $ref**: Ensure all referenced files exist and are accessible
2. **Schema Validation**: Check that your OpenAPI document follows the specification
3. **File Format**: Verify that YAML/JSON syntax is correct
4. **Circular References**: Avoid circular `$ref` dependencies

## FAQ

### Can I use both OpenAPI and AsyncAPI in the same project?

Yes! You can have separate configuration files for each input type and generate code to different output directories.

### What's the difference between OpenAPI 3.0 and 3.1?

OpenAPI 3.1 is fully compatible with JSON Schema 2020-12 and includes additional features like `const`, conditional schemas, and enhanced examples support.

### How do I handle authentication in generated clients?

Define security schemes in your OpenAPI document, and the generated client code will include appropriate authentication handling.

### Can I customize the generated code?

Yes, use the custom generator preset to create your own templates and generation logic. 