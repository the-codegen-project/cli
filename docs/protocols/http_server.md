---
sidebar_position: 99
---

# HTTP Server

The HTTP server generator creates typed [Express](https://expressjs.com/) handler stubs from your API specification — the structural inverse of the [HTTP client](./http_client.md). For every operation you get a `register<Op>(context)` function that mounts a route on a `Router` you supply, hands your handler typed path/query parameters, a typed request body and typed request headers, and marshals whatever your handler returns.

It is currently available through the generators ([channels](../generators/channels.md)).

This is available **only from [OpenAPI](../inputs/openapi.md) documents** (Swagger 2.0, OpenAPI 3.0 and 3.1). AsyncAPI input generates nothing for this protocol: the AsyncAPI HTTP path requires an `operation.reply()` plus an HTTP `method` binding, which is a poor fit for server stubs.

## TypeScript

Dependency: [express](https://github.com/expressjs/express) v4.

| **Feature** | Is supported? |
|---|---|
| Typed path & query parameters | ✅ |
| Typed request headers | ✅ |
| Typed request body | ✅ |
| Typed, status-code-discriminated responses | ✅ |
| Request payload validation | ✅ (via the [`payloads`](../generators/payloads.md) generator's `includeValidation`) |
| Handler hooks (before/after/onError) | ✅ |
| Router mounting under a prefix | ✅ |
| JSON based API | ✅ |
| XML based API | ❌ |
| Authentication / authorization enforcement | ❌ (compose your own middleware) |
| Typed response headers | ❌ |
| Frameworks other than Express | ❌ |
| Server / listener construction | ❌ (mounting stays yours) |
| POST / GET / PUT / PATCH / DELETE / HEAD / OPTIONS | ✅ |

## Configuration

```js
export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/channels',
      language: 'typescript',
      protocols: ['http_server']
    }
  ]
};
```

`http_server` and `http_client` can be listed together. They produce two independent files, each with its own copy of the shared types (including `HttpError`), so generating both sides of the same document is a supported and useful setup — see the [`openapi-http-server` example](https://github.com/the-codegen-project/cli/tree/main/examples/openapi-http-server).

## What is generated

For each operation, three things:

| Generated | What it is |
|---|---|
| `<Op>ServerResponse` | A status-code-discriminated union of everything the operation may answer with, assembled from the operation's declared `responses`. |
| `Register<Op>Context` | The register function's argument: `router`, your `callback`, and the shared `HttpServerContext` options. |
| `register<Op>(context)` | Mounts the route and handles parsing, parameter extraction, header deserialization, validation, response marshalling and error mapping. |

```ts
export type GetPetByIdServerResponse =
  | {status: 200; body: APetInterface | APet; headers?: Record<string, string | string[]>}
  | {status: 404; headers?: Record<string, string | string[]>};

export interface RegisterGetPetByIdContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    parameters: GetPetByIdParameters;
    requestHeaders: GetPetByIdHeaders;
    request: Request;
  }) => GetPetByIdServerResponse | Promise<GetPetByIdServerResponse>;
}
```

Using it:

```ts
import {Router} from 'express';
import {registerGetPetById} from './__gen__/channels/http_server';

const router = Router();

registerGetPetById({
  router,
  callback: ({parameters}) => {
    const pet = petStore.get(parameters.petId);
    if (!pet) {
      return {status: 404};       // declared by the document
    }
    return {status: 200, body: pet};
  }
});
```

Returning a status the document does not declare is a **compile error**, not a runtime surprise.

### The handler callback

The callback takes a single destructured object:

| Field | When it is present |
|---|---|
| `body` | Body-carrying methods (`POST`, `PUT`, `PATCH`) whose request body has a JSON schema. Already unmarshalled into the payload model. |
| `parameters` | The operation declares path or query parameters. A parsed instance of the generated parameter model. |
| `requestHeaders` | The operation declares header parameters. A typed object produced by the generated `deserialize<Model>Headers`. |
| `request` | Always. The raw Express `Request`, for anything not modelled (cookies, raw auth headers, the socket). |

`response` and `next` are deliberately **not** handed over: the callback's return value owns the response, and passing them would make that contract ambiguous.

The returned `body` accepts either a plain object literal or a model instance — object bodies are normalized to the model before `marshal()`, so the wire-name mapping is always applied.

## `HttpServerContext`

Every `Register<Op>Context` extends it:

| Option | Type | Description |
|---|---|---|
| `additionalHeaders` | `Record<string, string \| string[]>` | Headers added to every response the route sends. A per-response `headers` field wins over these. |
| `hooks` | `HttpServerHooks` | `beforeHandler`, `afterHandler` and `onError` — see below. |
| `skipRequestValidation` | `boolean` | Skip validating the incoming request payload against its JSON Schema. |

### Hooks

```ts
export interface HttpServerHooks {
  beforeHandler?: (params: {request: Request}) => void | Promise<void>;
  afterHandler?: (params: {request: Request; status: number; body?: string}) => void | Promise<void>;
  onError?: (params: {error: HttpGlobalError; request: Request}) =>
    {status: number; body?: unknown} | undefined | Promise<{status: number; body?: unknown} | undefined>;
}
```

`beforeHandler` runs before the request is read — throw an `HttpError` there to reject a request before it reaches your handler. `afterHandler` receives the JSON text that was sent. `onError` may return a replacement response, or `undefined` to keep the mapped one.

## Errors

Throw an `HttpError` (exported from the generated file) to answer with a specific status:

```ts
throw new HttpError('pet is not for sale', 409, 'Conflict', {petId});
```

Anything else you throw maps to a generic `500` — an internal error message is **never** leaked into the response body. If the response has already started (`headersSent`), the error is handed to Express' error middleware instead, because a half-written response cannot be recovered.

`HttpError` is shape-compatible with the one the generated HTTP client throws, so the same class reads the same on both sides of the wire.

## Request validation

When the [`payloads`](../generators/payloads.md) generator has `includeValidation` enabled (the default), request bodies are validated against their JSON Schema before your callback runs. A failing body is answered with `400` and the validation causes. The Ajv validator is compiled **once**, outside the route handler.

There is no separate configuration option — set `skipRequestValidation: true` on the context to turn it off per route.

## Mounting and prefixes

Generated code never calls `app.listen`, never constructs a `Router` and never mounts anything:

```ts
const app = express();
app.use(express.json());   // optional — the stubs also read the raw stream
app.use('/api/v2', router);
```

There is no `basePath` option because none is needed: Express makes `request.url` mount-relative, which is exactly what the generated parameter extraction matches the path template against.

`express.json()` is optional. `readJsonBody` returns an already-parsed body when a body parser populated one, and otherwise reads the raw stream itself.

## Explicit non-goals

- **No authentication or authorization.** Nothing is generated for verifying credentials, and per-operation `security` requirements are not enforced. Compose your own middleware.
- **No response header models.** Response headers are a free-form `Record<string, string | string[]>` on each response variant.
- **No content-type negotiation.** JSON only, matching the payload models — non-JSON content types are dropped with a warning during payload processing.
- **No frameworks other than Express**, and no framework-agnostic core layer.
- **No listener or server construction.**

## Known limitation

When an operation declares several body-carrying responses, the response payload becomes a *union* model. A non-object member of that union (an array or a primitive) has no importable module of its own, so its body is marshalled with `JSON.stringify` rather than the model's `marshal()` — no wire-name mapping is applied for that particular variant. Single-response operations and object union members are unaffected.
