---
sidebar_position: 1
---

# 🎯 Profiles (OpenAPI)

Profiles are high-level sugar for OpenAPI inputs that expand into the granular
generators tuned for **REST consumers**: plain TypeScript `interface` models with
**no** `marshal`/`unmarshal`/`validate` ceremony, plus standalone serializer
functions and an optional fetch client. They are the idiomatic shape expected by
tools like `openapi-typescript`, `orval`, `kubb` and `heyapi`.

```js
export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  language: 'typescript',
  profile: 'client', // or 'types'
  generators: [] // optional explicit generators are appended as overrides
};
```

## Available profiles

| Profile  | Expands into | Emits a client? |
|----------|--------------|-----------------|
| `types`  | interface `payloads` + interface `parameters` (with standalone serializers) + `headers` | No |
| `client` | everything in `types` **plus** `channels` (`http_client`) + `client` (`http`) | Yes |

### `types`

Generates the data model surface only — one plain interface per payload,
parameter set and header group. Parameter models come with free functions
(`serialize<Name>QueryParameters`, `serialize<Name>Url`) that carry the OpenAPI
style/explode logic, so you can build URLs without instantiating a class.

### `client`

Everything in `types`, plus a fetch-based HTTP client. Request bodies are
serialized with `JSON.stringify(payload)` and responses are returned as the
plain interface (`await res.json()` cast to the type) — no runtime marshalling.

## Relationship to the `types` **preset**

The `types` *profile* is distinct from the [`types` preset](./types.md): the
preset emits simple type aliases and enums derived from the whole document,
while the profile emits idiomatic **interface models** (payloads, parameters,
headers) for REST consumers. Use the profile when you want ready-to-consume
request/response types; use the preset when you just want shared type aliases.

## `modelType` (opt in without a profile)

Both the [`payloads`](./payloads.md) and [`parameters`](./parameters.md)
generators accept a `modelType: 'class' | 'interface'` option (default
`'class'`, which preserves the AsyncAPI/broker output). Setting
`modelType: 'interface'` is exactly what the profiles do under the hood, so you
can opt individual generators into interface output without adopting a whole
profile:

```js
{
  preset: 'payloads',
  outputPath: './src/payloads',
  modelType: 'interface'
}
```
