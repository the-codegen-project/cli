# OpenAPI HTTP Client

A minimal, self-contained example of generating a **type-safe HTTP client** from an OpenAPI document with the `channels` generator and the `http_client` protocol — and, importantly, how to *consume* it as an API client.

**Files:**
- `safepay-nordic-sample.json` — a trimmed OpenAPI 3.1 document (a payments-style API). None of its operations declare an `operationId`, so this also demonstrates how function names are synthesized.
- `codegen.config.js` — configuration selecting the `channels` generator with the `http_client` protocol.
- `src/index.ts` — a runnable demo consuming the generated client.
- `src/generated` — the generated output (committed so you can browse it without running anything).

## Usage

```bash
npm install
npm run generate   # regenerate src/generated from the OpenAPI document
npm run demo       # run the consumer demo (set SAFEPAY_SERVER to hit a real server)
```

## What gets generated, and what you actually use

The generator emits a few folders. As a **consumer** you mostly care about one file, and touch the others only through it:

| Folder / file | What it is | You use it to… |
|---|---|---|
| `generated/http_client.ts` | **The call functions** — one per operation, plus the shared auth/pagination/retry machinery (private). Only the operation functions are exported. | This is your entry point. Import functions from here. |
| `generated/payload/` | Request & response **body** models with `marshal()`/`unmarshal()`. | Build request bodies; read strongly-typed responses off `response.data`. |
| `generated/parameter/` | Path & query **parameter** models. | Supply path/query parameters to operations that need them. |
| `generated/index.ts` | Re-exports the protocol namespace (`http_client`). | `import {http_client} from './generated'`. |

You rarely call `marshal()`/`unmarshal()` yourself — the client does it. You construct a request-body model, pass it as `payload`, and read the typed result from `response.data`.

## The three moving parts (see `src/index.ts`)

```ts
import {http_client} from './generated';
import {PostV2ConnectRequest} from './generated/payload/PostV2ConnectRequest';
import {GetV2ConnectReferenceIdParameters} from './generated/parameter/GetV2ConnectReferenceIdParameters';

// Body: build it with the generated request model, pass as `payload`.
const body = new PostV2ConnectRequest({returnUrl: 'https://shop.example/return'});
const created = await http_client.postV2Connect({server, payload: body});
created.data.connectUrl; // typed

// Path parameters: supply them through the generated parameter model.
const params = new GetV2ConnectReferenceIdParameters({referenceId: 'ref_123'});
const connect = await http_client.getV2ConnectReferenceId({server, parameters: params});
connect.data.safepayAccountId; // typed
```

Every function returns `HttpClientResponse<T>` where `data` is the unmarshalled, typed response model, alongside `status`, `headers`, and pagination helpers.

## About the generated function names

The operations in this document have **no `operationId`**, so names are synthesized from the HTTP method and the path, preserving word boundaries:

| Operation | Generated function |
|---|---|
| `POST /v2/connect` | `postV2Connect` |
| `GET /v2/connect/{referenceId}` | `getV2ConnectReferenceId` |
| `GET /v2/users/{safepayAccountId}/bank-accounts` | `getV2UsersSafepayAccountIdBankAccounts` |

If your document declares `operationId`s, those are used verbatim (camel-cased) instead — which is almost always what you want. Give your operations meaningful `operationId`s for the cleanest client.
