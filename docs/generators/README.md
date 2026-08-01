---
sidebar_position: 99
label: Generators
---

# Generators
Generators, or preset's are the core of **The Codegen Project**, that determines what is generated for your project.

Each language and inputs have specific generators;

All available generators, across languages and inputs:
- [`payloads`](./payloads.md)
- [`parameters`](./parameters.md)
- [`headers`](./headers.md)
- [`types`](./types.md)
- [`channels`](./channels.md)
- [`client`](./client.md)
- [`models`](./models.md)
- [`custom`](./custom.md)

| **Inputs** | [`payloads`](./payloads.md) | [`parameters`](./parameters.md) | [`headers`](./headers.md) | [`types`](./types.md) | [`channels`](./channels.md) | [`client`](./client.md) | [`models`](./models.md) | [`custom`](./custom.md) |
|---|---|---|---|---|---|---|---|---|
| AsyncAPI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OpenAPI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| JSON Schema | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

> OpenAPI `channels` and `client` generate an HTTP client — see the [`openapi-http-client` example](https://github.com/the-codegen-project/cli/tree/main/examples/openapi-http-client). OpenAPI `channels` can also generate the *server* side with the [`http_server`](../protocols/http_server.md) protocol — see the [`openapi-http-server` example](https://github.com/the-codegen-project/cli/tree/main/examples/openapi-http-server).

| **Languages** | [`payloads`](./payloads.md) | [`parameters`](./parameters.md) | [`headers`](./headers.md) | [`types`](./types.md) | [`channels`](./channels.md) | [`client`](./client.md) | [`models`](./models.md) | [`custom`](./custom.md) |
|---|---|---|---|---|---|---|---|---|
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
