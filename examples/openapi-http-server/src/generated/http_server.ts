import {PostV2ConnectRequest, PostV2ConnectRequestInterface} from './payload/PostV2ConnectRequest';
import {PostV2ConnectResponse_200, PostV2ConnectResponse_200Interface} from './payload/PostV2ConnectResponse_200';
import {GetV2ConnectReferenceIdResponse_200, GetV2ConnectReferenceIdResponse_200Interface} from './payload/GetV2ConnectReferenceIdResponse_200';
import {GetV2UsersSafepayAccountIdBankAccountsResponse_200, GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface} from './payload/GetV2UsersSafepayAccountIdBankAccountsResponse_200';
import {Status} from './payload/Status';
import {BankAccount, BankAccountInterface} from './payload/BankAccount';
import {InitializeRequest, InitializeRequestInterface} from './payload/InitializeRequest';
import {InitializeModel, InitializeModelInterface} from './payload/InitializeModel';
import {GetConnectModel, GetConnectModelInterface} from './payload/GetConnectModel';
import {GetV2ConnectReferenceIdParameters, GetV2ConnectReferenceIdParametersInterface} from './parameter/GetV2ConnectReferenceIdParameters';
import {GetV2UsersSafepayAccountIdBankAccountsParameters, GetV2UsersSafepayAccountIdBankAccountsParametersInterface} from './parameter/GetV2UsersSafepayAccountIdBankAccountsParameters';
import {PostV2ConnectHeaders, serializePostV2ConnectHeadersHeaders, deserializePostV2ConnectHeadersHeaders} from './headers/PostV2ConnectHeaders';
import { NextFunction, Request, Response, Router } from 'express';

// ============================================================================
// Common Types - Shared across all HTTP server functions
// ============================================================================

/**
 * The global `Error`, captured under a name a payload model cannot take.
 *
 * A document is free to declare a schema called `Error` (it is the
 * conventional name for one), and its generated model is imported into this
 * module, shadowing the global for the whole file. Every reference below goes
 * through these aliases so that is harmless.
 */
const HttpGlobalError = globalThis.Error;
type HttpGlobalError = InstanceType<typeof globalThis.Error>;

/**
 * Error a handler throws to answer with a specific HTTP status.
 *
 * Shape-compatible with the `HttpError` the generated HTTP client throws, so
 * the same class reads the same on both sides of the wire. When `body` is set
 * it is sent as-is; otherwise a `{message, status, statusText}` object is sent.
 */
export class HttpError extends HttpGlobalError {
  status: number;
  statusText: string;
  body?: unknown;

  constructor(message: string, status: number, statusText: string, body?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/**
 * Hooks for observing and customizing the generated request handlers.
 */
export interface HttpServerHooks {
  /**
   * Called before the request is read, for logging, metrics or access control.
   * Throw an `HttpError` here to reject the request before it reaches the handler.
   */
  beforeHandler?: (params: {request: Request}) => void | Promise<void>;

  /**
   * Called after a response has been sent. `body` is the JSON text that went
   * out, or undefined when the response had no body.
   */
  afterHandler?: (params: {request: Request; status: number; body?: string}) => void | Promise<void>;

  /**
   * Called when a handler throws. Return a replacement response to override the
   * mapped one, or undefined to keep it.
   */
  onError?: (params: {error: HttpGlobalError; request: Request}) => {status: number; body?: unknown} | undefined | Promise<{status: number; body?: unknown} | undefined>;
}

/**
 * Base context shared by every generated register function.
 */
export interface HttpServerContext {
  /** Headers added to every response the registered route sends. */
  additionalHeaders?: Record<string, string | string[]>;

  /** Hooks for extensibility */
  hooks?: HttpServerHooks;

  /** Skip validating the incoming request payload against its JSON Schema. */
  skipRequestValidation?: boolean;
}

// ============================================================================
// Helper Functions - Shared logic extracted for reuse
// ============================================================================

/**
 * Read the request body as JSON.
 *
 * Works whether or not a body parser such as `express.json()` is mounted: an
 * already-parsed body is handed back untouched, otherwise the raw stream is
 * read. An empty body yields `undefined` instead of throwing, mirroring the
 * client's defensive `readOptionalJsonBody`.
 */
function readJsonBody(request: Request): Promise<unknown> {
  const parsed = (request as {body?: unknown}).body;
  if (typeof parsed === 'string') {
    return Promise.resolve(parsed.length === 0 ? undefined : JSON.parse(parsed));
  }
  // A body parser that saw no body leaves an empty object behind, so only a
  // non-empty parsed body short-circuits the raw read.
  if (parsed !== undefined && parsed !== null && (typeof parsed !== 'object' || Object.keys(parsed).length > 0)) {
    return Promise.resolve(parsed);
  }
  return new Promise<unknown>((resolve, reject) => {
    // A parser upstream may already have drained the stream; waiting for an
    // 'end' that will never fire again would hang the request forever.
    if (request.readableEnded || request.complete) {
      resolve(undefined);
      return;
    }
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => { raw += chunk; });
    request.on('end', () => {
      if (raw.length === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (parseError) {
        reject(parseError);
      }
    });
    request.on('error', reject);
  });
}

/**
 * Map a thrown error onto a response.
 *
 * An `HttpError` maps to its own status and body. Anything else is an internal
 * failure and maps to a generic 500 — an internal error message must never
 * become client-visible.
 */
function resolveErrorResponse(error: unknown): {status: number; body?: unknown} {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: error.body ?? {message: error.message, status: error.status, statusText: error.statusText}
    };
  }
  return {status: 500, body: {message: 'Internal Server Error', status: 500, statusText: 'Internal Server Error'}};
}

/**
 * Send a response.
 *
 * `body` is already-marshalled JSON text — a model's `marshal()` returns a
 * string and applies the wire-name mapping, so `send` is correct here and
 * `json` would double-encode it. `undefined` sends no body at all.
 */
function sendResponse({response, status, body, headers, additionalHeaders}: {
  response: Response;
  status: number;
  body?: string;
  headers?: Record<string, string | string[]>;
  additionalHeaders?: Record<string, string | string[]>;
}): void {
  // Per-response headers win over the context-wide ones.
  for (const [name, value] of Object.entries({...additionalHeaders, ...headers})) {
    response.setHeader(name, value);
  }
  response.status(status);
  if (body === undefined) {
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'application/json');
  response.send(body);
}

/**
 * Turn an error thrown by a handler into a response.
 *
 * A half-written response cannot be recovered, so once headers are on the wire
 * the error goes to Express' error middleware instead.
 */
async function handleHandlerError({error, request, response, next, hooks, additionalHeaders}: {
  error: unknown;
  request: Request;
  response: Response;
  next: NextFunction;
  hooks?: HttpServerHooks;
  additionalHeaders?: Record<string, string | string[]>;
}): Promise<void> {
  if (response.headersSent) {
    next(error);
    return;
  }
  let resolved = resolveErrorResponse(error);
  if (hooks?.onError && error instanceof HttpGlobalError) {
    const override = await hooks.onError({error, request});
    if (override !== undefined) {
      resolved = override;
    }
  }
  sendResponse({
    response,
    status: resolved.status,
    body: resolved.body === undefined ? undefined : JSON.stringify(resolved.body),
    additionalHeaders
  });
}

// ============================================================================
// Generated HTTP Server Functions
// ============================================================================

export type PostV2ConnectServerResponse =
  | {status: 200; body: PostV2ConnectResponse_200Interface | PostV2ConnectResponse_200; headers?: Record<string, string | string[]>}
  | {status: 400; headers?: Record<string, string | string[]>};

export interface RegisterPostV2ConnectContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    body: PostV2ConnectRequest;
    requestHeaders: PostV2ConnectHeaders;
    request: Request;
  }) => PostV2ConnectServerResponse | Promise<PostV2ConnectServerResponse>;
}

/**
 * Generates a ConnectUrl where the user can be validated and connected.
 *
 * @param context the handler registration context
 * @param context.router the Express router to mount the handler on
 * @param context.callback invoked for each request; its return value becomes the response
 * @param context.callback.body the deserialized request body
 * @param context.callback.requestHeaders deserialized from the request headers
 */
function registerPostV2Connect(context: RegisterPostV2ConnectContext): void {
  const validator = PostV2ConnectRequest.createValidator();
  context.router.post('/v2/connect', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const receivedData = await readJsonBody(request);
      if(!context.skipRequestValidation) {
          const {valid, errors} = PostV2ConnectRequest.validate({data: receivedData, ajvValidatorFunction: validator});
          if(!valid) {
            throw new HttpError(`Invalid request payload received; ${JSON.stringify({cause: errors})}`, 400, 'Bad Request');
          }
        }
      const body = PostV2ConnectRequest.unmarshal(JSON.stringify(receivedData));
      const requestHeaders = deserializePostV2ConnectHeadersHeaders(request.headers as Record<string, string | string[] | undefined>);
      const result = await context.callback({body, requestHeaders, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = (responsePayload instanceof PostV2ConnectResponse_200 ? responsePayload : new PostV2ConnectResponse_200(responsePayload)).marshal();
          break;
        }
        default:
          break;
      }
      sendResponse({response, status: result.status, body: responseBody, headers: result.headers, additionalHeaders: context.additionalHeaders});
      await context.hooks?.afterHandler?.({request, status: result.status, body: responseBody});
    } catch (error) {
      await handleHandlerError({error, request, response, next, hooks: context.hooks, additionalHeaders: context.additionalHeaders});
    }
  });
}

export type GetV2ConnectReferenceIdServerResponse =
  | {status: 200; body: GetV2ConnectReferenceIdResponse_200Interface | GetV2ConnectReferenceIdResponse_200; headers?: Record<string, string | string[]>}
  | {status: 404; headers?: Record<string, string | string[]>};

export interface RegisterGetV2ConnectReferenceIdContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    parameters: GetV2ConnectReferenceIdParameters;
    request: Request;
  }) => GetV2ConnectReferenceIdServerResponse | Promise<GetV2ConnectReferenceIdServerResponse>;
}

/**
 * Translate a ReferenceId into a SafepayAccountId.
 *
 * @param context the handler registration context
 * @param context.router the Express router to mount the handler on
 * @param context.callback invoked for each request; its return value becomes the response
 * @param context.callback.parameters extracted from the request path and query
 */
function registerGetV2ConnectReferenceId(context: RegisterGetV2ConnectReferenceIdContext): void {
  context.router.get('/v2/connect/:referenceId', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const parameters = GetV2ConnectReferenceIdParameters.fromUrl(request.url, '/v2/connect/{referenceId}');
      const result = await context.callback({parameters, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = (responsePayload instanceof GetV2ConnectReferenceIdResponse_200 ? responsePayload : new GetV2ConnectReferenceIdResponse_200(responsePayload)).marshal();
          break;
        }
        default:
          break;
      }
      sendResponse({response, status: result.status, body: responseBody, headers: result.headers, additionalHeaders: context.additionalHeaders});
      await context.hooks?.afterHandler?.({request, status: result.status, body: responseBody});
    } catch (error) {
      await handleHandlerError({error, request, response, next, hooks: context.hooks, additionalHeaders: context.additionalHeaders});
    }
  });
}

export type GetV2UsersSafepayAccountIdBankAccountsServerResponse =
  | {status: 200; body: GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface | GetV2UsersSafepayAccountIdBankAccountsResponse_200; headers?: Record<string, string | string[]>};

export interface RegisterGetV2UsersSafepayAccountIdBankAccountsContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    parameters: GetV2UsersSafepayAccountIdBankAccountsParameters;
    request: Request;
  }) => GetV2UsersSafepayAccountIdBankAccountsServerResponse | Promise<GetV2UsersSafepayAccountIdBankAccountsServerResponse>;
}

/**
 * Returns the bank accounts registered for a Safepay account.
 *
 * @param context the handler registration context
 * @param context.router the Express router to mount the handler on
 * @param context.callback invoked for each request; its return value becomes the response
 * @param context.callback.parameters extracted from the request path and query
 */
function registerGetV2UsersSafepayAccountIdBankAccounts(context: RegisterGetV2UsersSafepayAccountIdBankAccountsContext): void {
  context.router.get('/v2/users/:safepayAccountId/bank-accounts', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const parameters = GetV2UsersSafepayAccountIdBankAccountsParameters.fromUrl(request.url, '/v2/users/{safepayAccountId}/bank-accounts');
      const result = await context.callback({parameters, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = (responsePayload instanceof GetV2UsersSafepayAccountIdBankAccountsResponse_200 ? responsePayload : new GetV2UsersSafepayAccountIdBankAccountsResponse_200(responsePayload)).marshal();
          break;
        }
        default:
          break;
      }
      sendResponse({response, status: result.status, body: responseBody, headers: result.headers, additionalHeaders: context.additionalHeaders});
      await context.hooks?.afterHandler?.({request, status: result.status, body: responseBody});
    } catch (error) {
      await handleHandlerError({error, request, response, next, hooks: context.hooks, additionalHeaders: context.additionalHeaders});
    }
  });
}

export { registerPostV2Connect, registerGetV2ConnectReferenceId, registerGetV2UsersSafepayAccountIdBankAccounts };
