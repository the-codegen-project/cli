---
sidebar_position: 99
---

# EventCatalog

[EventCatalog](https://eventcatalog.dev) is a documentation tool that organizes events, services, and domains in a single browsable catalog. The Codegen Project can read an EventCatalog directory directly and generate code for a chosen service — no need to maintain a separate AsyncAPI/OpenAPI file alongside the catalog.

The loader is a translation layer: it picks the requested service, follows its `specifications` block (or its `sends`/`receives` events for native mode), and routes the run through the existing AsyncAPI or OpenAPI pipeline. As a result, every preset that works for those input types works here too.

## Supported Generators

| **Presets** | EventCatalog |
|---|---|
| [`payloads`](../generators/payloads.md) | ✅ |
| [`parameters`](../generators/parameters.md) | ✅ |
| [`headers`](../generators/headers.md) | ✅ |
| [`types`](../generators/types.md) | ✅ |
| [`channels`](../generators/channels.md) | ✅ |
| [`client`](../generators/client.md) | ✅ * |
| [`custom`](../generators/custom.md) | ✅ |
| [`models`](../generators/models.md) | ✅ |

\* The `client` preset is currently only generated when the resolved spec is AsyncAPI; OpenAPI services do not produce a client wrapper.

## Configuration

| Field | Required | Description |
|---|---|---|
| `inputType` | yes | Must be `'eventcatalog'`. |
| `inputPath` | yes | Path (or remote URL) to the EventCatalog root — the directory that contains `services/`. |
| `service` | yes | The `id` of the service inside `services/<id>/index.md` to generate from. |
| `specType` | no | Set to `'asyncapi'` or `'openapi'` to disambiguate when a service declares both `asyncapiPath` and `openapiPath`. |
| `auth` | no | Bearer / apiKey / custom auth used when the service's spec path is a remote URL. See [configurations guide](../configurations.md#remote-url-inputs). |

```js
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  service: 'user-service',
  language: 'typescript',
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' },
    { preset: 'channels', outputPath: './src/channels', protocols: ['nats'] },
    { preset: 'client', outputPath: './src/client', protocols: ['nats'] }
  ]
};
```

## The three modes

The loader picks one of three modes based on the selected service's `index.md` frontmatter.

### 1. AsyncAPI service

The service declares an `asyncapiPath` under `specifications`. The loader reads that file and runs the AsyncAPI pipeline.

```yaml
---
id: user-service
name: User Service
specifications:
  asyncapiPath: asyncapi.yaml
---
```

### 2. OpenAPI service

The service declares an `openapiPath` under `specifications`. The loader reads that file and runs the OpenAPI pipeline.

```yaml
---
id: petstore-api
name: Petstore API
specifications:
  openapiPath: openapi.json
---
```

### 3. Native service (no `specifications`)

The service has no spec file but does list `sends` / `receives` events. The loader walks each referenced event under `events/<event-id>/`, reads its `schema.json` (or whatever `schemaPath` is set in the event's frontmatter), and **synthesizes an AsyncAPI 3.0 document** from the result. That synthesized document then drives every downstream generator, so presets like `channels` and `client` work seamlessly without you authoring an AsyncAPI file.

```yaml
---
id: order-service
name: Order Service
sends:
  - id: OrderCreated
    version: 1.0.0
receives:
  - id: OrderShipped
    version: 1.0.0
---
```

#### Native-mode synthesis rules

For each `sends[i]` event the synthesized document contains:
- a channel keyed by the event id, with a single message whose payload is the event's schema content
- an operation `send<EventId>` with `action: 'send'` referring to that channel

Each `receives[i]` event produces the same channel/message pair but with `action: 'receive'`. The synthesized `info` block uses:
- `info.title` = `service.name` (falls back to `service.id`)
- `info.version` = `service.version` (falls back to `'1.0.0'`)
- `info.description` = `service.summary` when present

If you need richer mappings — multi-message channels, parameters, status-code variants, etc. — author a real AsyncAPI document and reference it via `specifications.asyncapiPath` instead.

## Both-specs services

If a service declares **both** `asyncapiPath` and `openapiPath`, the loader needs to know which one to follow. Set `specType` on the configuration:

```js
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  service: 'order-service',
  specType: 'openapi',
  language: 'typescript',
  generators: [/* … */]
};
```

If `specType` is missing the loader throws a descriptive error so the run fails early with a clear next step. Generating from both specs in a single run is **not supported** in this version (see the limitations section). The recommended workaround is to keep two separate config files — one with `specType: 'asyncapi'`, one with `specType: 'openapi'` — and run them independently.

## Remote URLs in `asyncapiPath` / `openapiPath`

If your service frontmatter points to a remote URL instead of a local file, the loader fetches it the same way the underlying input pipeline does. The `auth` field on your codegen configuration is passed through unchanged. See the [remote URL inputs section](../configurations.md#remote-url-inputs) of the configurations guide for the full set of auth options and security considerations.

## Examples

The repository ships three end-to-end examples under `examples/`:

- `examples/eventcatalog-asyncapi/` — a service backed by a real AsyncAPI 3.0 document
- `examples/eventcatalog-openapi/` — a service backed by an OpenAPI 3.0 document
- `examples/eventcatalog-native/` — a service with no spec file, demonstrating the native-mode synthesis

Each example contains an `eventcatalog/` directory plus a `codegen.config.mjs` that mirrors the snippets above. Running `npx codegen generate` inside any of the three produces the generated TypeScript directly.

## Limitations

- **Dual-spec generation in one run is not supported.** Use two configs and run them sequentially.
- **`domains/` and `flows/` are ignored.** Only the selected service plus the events it directly references are read.
- **Cross-service event references aren't resolved.** Events referenced via `receives` are loaded from the catalog's `events/<id>/` directory, not from the producing service.
- **Browser mode is not supported.** EventCatalog is filesystem-bound; the browser bundle returns a clear error when invoked with `specFormat: 'eventcatalog'`. Use AsyncAPI / OpenAPI / JSON Schema directly in the browser.
