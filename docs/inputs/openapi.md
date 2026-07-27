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
| [`channels`](../generators/channels.md) | ✅ |
| [`client`](../generators/client.md) | ✅ |
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

## Content types

Request and response bodies are extracted from JSON content types: `application/json`, `text/json`, and any type whose subtype ends in `+json` (for example `application/hal+json` or `application/vnd.api+json`). When several JSON content types are present, `application/json` is preferred.

When an operation declares a body but **none** of its content types are JSON (for example an XML-only response), no payload model is generated and a warning naming the operation and its content types is logged — the omission is never silent.

## Servers and base URL

For the `channels`/`client` HTTP client, the document's first `http`/`https` server URL becomes the generated default `baseUrl`. Server URL variables are substituted with their declared defaults; a server whose variable has no default, or whose URL is relative, is skipped with a log. See [HTTP client base URL precedence](../protocols/http_client.md#base-url).

## Current limitations

These constructs are not generated and are reported with a warning rather than dropped silently:

- **Cookie parameters** — `in: cookie` parameters have no generated handling and are dropped (path, query, and header parameters are unaffected).
- **Webhooks** — the OpenAPI 3.1 `webhooks` section is not traversed.
- **Non-JSON bodies** — only JSON-family content types produce payload models (see [Content types](#content-types)).

## Remote URL inputs

`inputPath` accepts an `http://` or `https://` URL. Optional authentication (bearer token, API key, or custom headers) is configured via the `auth` field. Cross-spec `$ref` URLs are also resolved through the same auth-aware HTTP client. See the [configurations guide](../configurations.md#remote-url-inputs) for examples and the [auth scope and security considerations](../configurations.md#auth-scope-and-security-considerations) section — the configured headers are sent to every `$ref` target as well as the root URL.

## Troubleshooting

## FAQ

### Can I use both OpenAPI and AsyncAPI in the same project?

Yes! You can have separate configuration files for each input type and generate code to different output directories.

### Can I customize the generated code?

Yes, use the [custom generator](../generators/custom) preset to create your own generation logic. 