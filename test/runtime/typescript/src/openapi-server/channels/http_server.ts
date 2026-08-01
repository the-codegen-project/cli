import {APet, APetInterface} from './../payloads/APet';
import * as FindPetsByStatusAndCategoryResponse_200Module from './../payloads/FindPetsByStatusAndCategoryResponse_200';
import {PetCategory, PetCategoryInterface} from './../payloads/PetCategory';
import {PetTag, PetTagInterface} from './../payloads/PetTag';
import {Status} from './../payloads/Status';
import {ItemStatus} from './../payloads/ItemStatus';
import {PetOrder, PetOrderInterface} from './../payloads/PetOrder';
import {AUser, AUserInterface} from './../payloads/AUser';
import {AnUploadedResponse, AnUploadedResponseInterface} from './../payloads/AnUploadedResponse';
import {FindPetsByStatusAndCategoryParameters, FindPetsByStatusAndCategoryParametersInterface} from './../parameters/FindPetsByStatusAndCategoryParameters';
import {FindPetsByStatusAndCategoryHeaders, serializeFindPetsByStatusAndCategoryHeadersHeaders, deserializeFindPetsByStatusAndCategoryHeadersHeaders} from './../headers/FindPetsByStatusAndCategoryHeaders';
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

export type AddPetServerResponse =
  | {status: 200; body: APetInterface | APet; headers?: Record<string, string | string[]>}
  | {status: 405; headers?: Record<string, string | string[]>};

export interface RegisterAddPetContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    body: APet;
    request: Request;
  }) => AddPetServerResponse | Promise<AddPetServerResponse>;
}

/**
 * Registers an HTTP POST handler for /pet
 */
function registerAddPet(context: RegisterAddPetContext): void {
  const validator = APet.createValidator();
  context.router.post('/pet', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const receivedData = await readJsonBody(request);
      if(!context.skipRequestValidation) {
          const {valid, errors} = APet.validate({data: receivedData, ajvValidatorFunction: validator});
          if(!valid) {
            throw new HttpError(`Invalid request payload received; ${JSON.stringify({cause: errors})}`, 400, 'Bad Request');
          }
        }
      const body = APet.unmarshal(JSON.stringify(receivedData));
      const result = await context.callback({body, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = (responsePayload instanceof APet ? responsePayload : new APet(responsePayload)).marshal();
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

export type UpdatePetServerResponse =
  | {status: 200; body: APetInterface | APet; headers?: Record<string, string | string[]>}
  | {status: 400; headers?: Record<string, string | string[]>}
  | {status: 404; headers?: Record<string, string | string[]>}
  | {status: 405; headers?: Record<string, string | string[]>};

export interface RegisterUpdatePetContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    body: APet;
    request: Request;
  }) => UpdatePetServerResponse | Promise<UpdatePetServerResponse>;
}

/**
 * Registers an HTTP PUT handler for /pet
 */
function registerUpdatePet(context: RegisterUpdatePetContext): void {
  const validator = APet.createValidator();
  context.router.put('/pet', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const receivedData = await readJsonBody(request);
      if(!context.skipRequestValidation) {
          const {valid, errors} = APet.validate({data: receivedData, ajvValidatorFunction: validator});
          if(!valid) {
            throw new HttpError(`Invalid request payload received; ${JSON.stringify({cause: errors})}`, 400, 'Bad Request');
          }
        }
      const body = APet.unmarshal(JSON.stringify(receivedData));
      const result = await context.callback({body, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = (responsePayload instanceof APet ? responsePayload : new APet(responsePayload)).marshal();
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

export type FindPetsByStatusAndCategoryServerResponse =
  | {status: 200; body: FindPetsByStatusAndCategoryResponse_200Module.FindPetsByStatusAndCategoryResponse_200; headers?: Record<string, string | string[]>}
  | {status: 400; headers?: Record<string, string | string[]>}
  | {status: 404; headers?: Record<string, string | string[]>};

export interface RegisterFindPetsByStatusAndCategoryContext extends HttpServerContext {
  router: Router;
  callback: (params: {
    parameters: FindPetsByStatusAndCategoryParameters;
    requestHeaders: FindPetsByStatusAndCategoryHeaders;
    request: Request;
  }) => FindPetsByStatusAndCategoryServerResponse | Promise<FindPetsByStatusAndCategoryServerResponse>;
}

/**
 * Find pets by status and category with additional filtering options
 */
function registerFindPetsByStatusAndCategory(context: RegisterFindPetsByStatusAndCategoryContext): void {
  context.router.get('/pet/findByStatus/:status/:categoryId', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
      const parameters = FindPetsByStatusAndCategoryParameters.fromUrl(request.url, '/pet/findByStatus/{status}/{categoryId}');
      const requestHeaders = deserializeFindPetsByStatusAndCategoryHeadersHeaders(request.headers as Record<string, string | string[] | undefined>);
      const result = await context.callback({parameters, requestHeaders, request});
      let responseBody: string | undefined = undefined;
      switch (result.status) {
        case 200: {
          const responsePayload = result.body;
          responseBody = FindPetsByStatusAndCategoryResponse_200Module.marshal(responsePayload);
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

export { registerAddPet, registerUpdatePet, registerFindPetsByStatusAndCategory };
