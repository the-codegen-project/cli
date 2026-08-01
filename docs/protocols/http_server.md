---
sidebar_position: 99
---

# HTTP Server

The HTTP server generator creates typed [Express](https://expressjs.com/) handler stubs from your API specification — the structural inverse of the [HTTP client](./http_client.md). For every operation you get a `register<Op>(context)` function that mounts a route on a `Router` you supply, hands your handler typed path/query parameters, a typed request body and typed request headers, and marshals whatever your handler returns.

It is currently available through the generators ([channels](../generators/channels.md)).

This is available **only from [OpenAPI](../inputs/openapi.md) documents** (Swagger 2.0, OpenAPI 3.0 and 3.1). AsyncAPI input generates nothing for this protocol.

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
| Authentication / authorization enforcement | ❌ (see [Security requirements](#security-requirements)) |
| Typed response headers | ❌ |
| Frameworks | Express |
| Server / listener construction | ❌ (you construct and mount the router) |
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

The callback's return value is the response — `response` and `next` are not passed in. Use `request` for anything the models do not cover.

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

Anything else you throw maps to a generic `500` — an internal error message is **never** leaked into the response body. If the response has already started (`headersSent`), the error is passed to Express' error middleware instead, so mount one if you need to observe those.

`HttpError` is shape-compatible with the one the generated HTTP client throws, so the same class reads the same on both sides of the wire.

## Request validation

When the [`payloads`](../generators/payloads.md) generator has `includeValidation` enabled (the default), request bodies are validated against their JSON Schema before your callback runs. A failing body is answered with `400` and the validation causes. Validation costs no per-request compilation — the validator is built when the route is registered.

There is no separate configuration option — set `skipRequestValidation: true` on the context to turn it off per route.

## Mounting and prefixes

Generated code never calls `app.listen`, never constructs a `Router` and never mounts anything:

```ts
const app = express();
app.use(express.json());   // optional — the stubs also read the raw stream
app.use('/api/v2', router);
```

Mounting under a prefix needs no extra configuration — there is no `basePath` option. Express makes `request.url` mount-relative, so path parameters resolve the same whether the router is mounted at `/` or at `/api/v2`.

`express.json()` is optional. `readJsonBody` returns an already-parsed body when a body parser populated one, and otherwise reads the raw stream itself.

## Multiple response bodies

When an operation declares several body-carrying responses, the response payload becomes a *union* model. A non-object member of that union — an array or a primitive — has no importable module of its own, so its body is marshalled with `JSON.stringify` rather than the model's `marshal()`, and no wire-name mapping is applied to that variant. If the operation's schemas rename properties on the wire, return an object variant for those responses. Single-response operations and object union members are unaffected.

## Security requirements

Per-operation `security` requirements are read from the document but not enforced: no credential verification is generated. Mount your own middleware on the router before the generated routes, and throw an [`HttpError`](#errors) from it to reject a request.
