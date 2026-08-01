# OpenAPI HTTP Server

A self-contained example of generating **typed Express handler stubs** from an OpenAPI document with the `channels` generator and the `http_server` protocol — and calling them with the `http_client` generated from the *same* document.

It uses the same `safepay-nordic-sample.json` as the [OpenAPI HTTP Client](../openapi-http-client/) example, so the two examples show the two sides of one API.

**Files:**
- `safepay-nordic-sample.json` — a trimmed OpenAPI 3.1 document (a payments-style API). None of its operations declare an `operationId`, so function names are synthesized from method + path.
- `codegen.config.js` — configuration selecting the `channels` generator with both the `http_server` and `http_client` protocols.
- `src/server.ts` — where you write business logic: one `callback` per operation.
- `src/demo.ts` — a runnable demo booting the server and driving it with the generated client.
- `src/generated/` — the generated output (committed so you can browse it without running anything).

## Usage

```bash
npm install
npm run generate   # regenerate src/generated from the OpenAPI document
npm run demo       # boot the server and call it with the generated client
```

## Where you add business logic

For every operation the generator emits three things:

| Generated | What it is |
|---|---|
| `<Op>ServerResponse` | A **status-code-discriminated union** of everything the operation is allowed to answer with. Returning an undeclared status is a compile error. |
| `Register<Op>Context` | The argument to the register function: the `router` to mount on, your `callback`, and the shared server options (`hooks`, `additionalHeaders`, `skipRequestValidation`). |
| `register<Op>(context)` | Mounts the route. Handles parsing, parameter extraction, header deserialization, request validation, response marshalling and error mapping. |

Your code is the `callback` body — nothing else:

```ts
import {Router} from 'express';
import {registerGetV2ConnectReferenceId} from './generated/http_server';

const router = Router();

registerGetV2ConnectReferenceId({
  router,
  callback: ({parameters}) => {
    // `parameters` is a typed, parsed GetV2ConnectReferenceIdParameters.
    const session = lookUp(parameters.referenceId);
    if (!session) {
      return {status: 404};          // declared by the document
    }
    return {status: 200, body: {referenceId: parameters.referenceId, /* … */}};
  }
});
```

The callback receives a single destructured object carrying `body` (body-carrying methods only), `parameters`, `requestHeaders` and always `request`. `response` and `next` are deliberately *not* handed over — the returned value owns the response.

## Mounting

Nothing generated ever calls `app.listen`, constructs a `Router`, or mounts anything — that stays yours:

```ts
const app = express();
app.use(express.json());        // optional: the stubs read the raw stream too
app.use('/api', router);        // a prefix works — path templates still match
```

There is no `basePath` option because none is needed: Express makes `request.url` mount-relative, which is exactly what the generated parameter extraction matches against.

## Errors

Throw an `HttpError` (exported from `generated/http_server.ts`) to answer with a specific status:

```ts
throw new HttpError('returnUrl must be https', 400, 'Bad Request', {field: 'returnUrl'});
```

Anything else you throw becomes a `500` with a generic body — an internal error message is never leaked to the caller. `hooks.onError` can override the mapped response.

It is the same `HttpError` shape the generated client throws, so the class reads the same on both sides of the wire.

## Request validation

Request bodies are validated against their JSON Schema before your callback runs (the `payloads` generator's `includeValidation`, on by default). A failing body is answered with `400` and the validation causes. Set `skipRequestValidation: true` on the context to turn it off for a route.

## What is deliberately not generated

- **No authentication/authorization checks.** Compose your own middleware; the document's `security` requirements are not enforced.
- **No frameworks other than Express.**
- **No response header models.** Response headers are a free-form `Record<string, string | string[]>` per response variant.
- **No content-type negotiation.** JSON only, matching the payload models.
- **No server construction.** No `listen`, no `Router`, no mounting.

## Known limitation

When an operation declares several body-carrying responses, each becomes a member of a payload *union*. A non-object member (an array or a primitive) has no importable module of its own, so its body is marshalled with `JSON.stringify` rather than the model's `marshal()` — meaning no wire-name mapping is applied for that variant.
