# OpenAPI Filtering

A minimal, self-contained example of the root-config **`filter`** option, which
restricts code generation to a subset of the input document's paths/operations
instead of everything.

## The API

[`openapi.json`](./openapi.json) defines four operations:

| Path                   | Operation      | Response schema |
| ---------------------- | -------------- | --------------- |
| `GET /users`           | `listUsers`    | `User` (→ `Address`) |
| `GET /users/{id}/audit`| `getUserAudit` | `AuditEntry`    |
| `GET /orders`          | `listOrders`   | `Order`         |
| `GET /metrics`         | `getMetrics`   | `Metrics`       |

## The filter

[`codegen.config.js`](./codegen.config.js):

```js
filter: {
  include: ['/users', '/users/**', '/orders'],
  exclude: ['/users/{id}/audit']
}
```

Patterns are [minimatch](https://github.com/isaacs/minimatch) globs, matched
against the **path template** or the **operationId**. `exclude` is applied after
`include`, so an excluded item is always dropped. An empty/absent `filter`
generates everything, unchanged.

> Note: `/users/**` matches nested paths like `/users/{id}/audit` but **not**
> `/users` itself — list both when you want the collection and everything under
> it.

## What gets generated

Running the generator:

```bash
npm run generate
```

produces payload models for **only the retained operations**:

```
src/generated/payloads/
├── User.ts                    # kept: /users
├── Address.ts                 # kept: referenced by User (nested)
├── ListUsersResponse_200.ts   # kept: /users response
├── Order.ts                   # kept: /orders
└── ListOrdersResponse_200.ts  # kept: /orders response
```

Filtered out:

- **`/users/{id}/audit`** — matched `include` via `/users/**` but removed by
  `exclude`, so no `getUserAudit` models are generated.
- **`/metrics`** — never matched `include`, so it is dropped.
- **`AuditEntry`** and **`Metrics`** — component schemas referenced only by the
  dropped operations, so they are **pruned automatically** (orphan pruning).
  `Address` survives because it is still referenced by the retained `User`.

## Notes

- Filtering happens once, while the document is loaded, so **every** generator
  (payloads, parameters, headers, types, channels, client) sees the already
  subsetted document — no per-generator configuration needed.
- The same `filter` option works for AsyncAPI input, where patterns match
  against channel address, channel id, or operation id.
- JSON Schema input has no `filter` (it has no paths/channels to filter).
