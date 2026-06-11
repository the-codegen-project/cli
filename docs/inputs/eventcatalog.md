---
sidebar_position: 99
---

# EventCatalog

[EventCatalog](https://eventcatalog.dev) is a documentation tool that organizes events, services, and domains in a single browsable catalog. The Codegen Project can read an EventCatalog directory directly and generate code for a chosen service — no need to maintain a separate AsyncAPI/OpenAPI file alongside the catalog.

The loader is a producer composer: it picks the requested service, reads the underlying spec(s) (AsyncAPI and/or OpenAPI) plus any native events declared under `sends`/`receives`, and feeds whichever combination is present to the typed `{Generator}Input` shapes consumed by built-in generators. Native events are turned into channel/payload entries directly — no AsyncAPI synthesis round-trip.

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

\* The `client` preset currently only generates a client wrapper for AsyncAPI-backed services.

## Configuration

| Field | Required | Description |
|---|---|---|
| `inputType` | yes | Must be `'eventcatalog'`. |
| `inputPath` | yes | Path (or remote URL) to the EventCatalog root — the directory that contains `services/`. |
| `service` | yes | The `id` of the service inside `services/<id>/index.md` to generate from. |
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

## How service modes are composed

The loader builds a `ParsedEventCatalog` from the selected service's `index.md` frontmatter. Each EventCatalog producer composes whatever fields are present:

- `specifications.asyncapiPath` → load the AsyncAPI document; AsyncAPI producers run.
- `specifications.openapiPath` → load the OpenAPI document; OpenAPI producers run.
- Native `sends` / `receives` events with `events/<id>/schema.json` → emitted as channel/payload entries directly.

Composition is additive: a service with both an AsyncAPI spec and an OpenAPI spec runs both producers and merges the results. There is no `specType` disambiguator because the producer-composition design lets every spec contribute. (When a service declares specs, the listed `sends`/`receives` event references are treated as catalog-navigation metadata only — the spec is the authoritative source of channels and payloads.)

### AsyncAPI service

```yaml
---
id: user-service
name: User Service
specifications:
  asyncapiPath: asyncapi.yaml
---
```

### OpenAPI service

```yaml
---
id: petstore-api
name: Petstore API
specifications:
  openapiPath: openapi.json
---
```

### Native service (no `specifications`)

The service has no spec file but lists `sends` / `receives` events. The EventCatalog producers walk each referenced event under `events/<event-id>/`, read its `schema.json` (or whatever `schemaPath` is set in the event's frontmatter), and emit channel/payload entries directly:

- one channel per event id (channel address = event id)
- one operation per event with `action: 'send'` for `sends[i]` and `action: 'receive'` for `receives[i]`
- one payload entry keyed by the event id with the schema as the model

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

If you need richer mappings — multi-message channels, parameters, status-code variants, etc. — author a real AsyncAPI document and reference it via `specifications.asyncapiPath` instead.

### Both-specs services

If a service declares **both** `asyncapiPath` and `openapiPath`, both pipelines run and their results are merged into the typed `{Generator}Input` shapes. Channels/payloads/etc. that appear in only one spec are emitted; entries that overlap defer to whichever producer ran last (OpenAPI in the current implementation). This removes the need for a manual `specType` disambiguator that earlier versions required.

## Remote URLs in `asyncapiPath` / `openapiPath`

If your service frontmatter points to a remote URL instead of a local file, the loader fetches it the same way the underlying input pipeline does. The `auth` field on your codegen configuration is passed through unchanged. See the [remote URL inputs section](../configurations.md#remote-url-inputs) of the configurations guide for the full set of auth options and security considerations.

## Examples

The repository ships three end-to-end examples under `examples/`:

- `examples/eventcatalog-asyncapi/` — a service backed by a real AsyncAPI 3.0 document
- `examples/eventcatalog-openapi/` — a service backed by an OpenAPI 3.0 document
- `examples/eventcatalog-native/` — a service with no spec file, demonstrating the native-event flow

Each example contains an `eventcatalog/` directory plus a `codegen.config.mjs` that mirrors the snippets above. Running `npx codegen generate` inside any of the three produces the generated TypeScript directly.

## Limitations

- **`domains/` and `flows/` are ignored.** Only the selected service plus the events it directly references are read.
- **Cross-service event references aren't resolved.** Events referenced via `receives` are loaded from the catalog's `events/<id>/` directory, not from the producing service.
- **Browser mode is not supported.** EventCatalog is filesystem-bound; the browser bundle returns a clear error when invoked with `specFormat: 'eventcatalog'`. Use AsyncAPI / OpenAPI / JSON Schema directly in the browser.
