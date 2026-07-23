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

## Remote URL inputs

`inputPath` accepts an `http://` or `https://` URL. Optional authentication (bearer token, API key, or custom headers) is configured via the `auth` field. Cross-spec `$ref` URLs are also resolved through the same auth-aware HTTP client. See the [configurations guide](../configurations.md#remote-url-inputs) for examples and the [auth scope and security considerations](../configurations.md#auth-scope-and-security-considerations) section — the configured headers are sent to every `$ref` target as well as the root URL.

## Filtering paths & operations

Use the root-level `filter` field to generate code for only a subset of the
document's paths/operations. Glob patterns are matched against the **path
template** or the **operationId** (the spec's `operationId`, or a derived id when
absent):

```javascript
export default {
  inputType: 'openapi',
  inputPath: './openapi.yaml',
  filter: {
    include: ['/users', '/users/**', '/orders'],
    exclude: ['/users/{id}/audit']
  },
  generators: [ /* ... */ ]
};
```

`exclude` is applied after `include`; component schemas (`components.schemas` for
3.x, `definitions` for 2.0) left orphaned by the filtering are pruned
automatically. Only real HTTP methods on a path item are treated as operations —
`parameters`, `servers`, `summary`, and `description` are preserved on retained
paths. With no `filter`, output is unchanged. See the
[filtering section of the configurations guide](../configurations.md#filtering-channels-operations--paths)
for full semantics, and the
[`openapi-filtering` example](https://github.com/the-codegen-project/cli/tree/main/examples/openapi-filtering).

## Troubleshooting

## FAQ

### Can I use both OpenAPI and AsyncAPI in the same project?

Yes! You can have separate configuration files for each input type and generate code to different output directories.

### Can I customize the generated code?

Yes, use the [custom generator](../generators/custom) preset to create your own generation logic. 