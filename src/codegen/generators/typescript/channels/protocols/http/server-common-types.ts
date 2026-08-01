/**
 * Generates the common types and helper functions shared across all generated
 * HTTP server functions. Rendered once per `http_server.ts`, mirroring
 * `renderHttpCommonTypes` on the client side.
 *
 * The two sides deliberately emit their own copy of `HttpError` and the
 * `HttpGlobalError` alias: `http_client.ts` and `http_server.ts` are
 * independent modules, so neither may import from the other. The *source* of
 * those fragments is shared — see `./shared`.
 */
import {HTTP_GLOBAL_ERROR_ALIAS, renderHttpErrorClass} from './shared';

const SERVER_HTTP_ERROR_DESCRIPTION = `/**
 * Error a handler throws to answer with a specific HTTP status.
 *
 * Shape-compatible with the \`HttpError\` the generated HTTP client throws, so
 * the same class reads the same on both sides of the wire. When \`body\` is set
 * it is sent as-is; otherwise a \`{message, status, statusText}\` object is sent.
 */`;

/**
 * Renders the shared infrastructure block for the HTTP server protocol.
 *
 * Stateless — the same input always produces the same output, so it can be
 * emitted once per file without any bookkeeping.
 */
export function renderHttpServerCommonTypes(): string {
  return `// ============================================================================
// Common Types - Shared across all HTTP server functions
// ============================================================================

${HTTP_GLOBAL_ERROR_ALIAS}

${renderHttpErrorClass(SERVER_HTTP_ERROR_DESCRIPTION)}

/**
 * Hooks for observing and customizing the generated request handlers.
 */
export interface HttpServerHooks {
  /**
   * Called before the request is read, for logging, metrics or access control.
   * Throw an \`HttpError\` here to reject the request before it reaches the handler.
   */
  beforeHandler?: (params: {request: Request}) => void | Promise<void>;

  /**
   * Called after a response has been sent. \`body\` is the JSON text that went
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
 * Works whether or not a body parser such as \`express.json()\` is mounted: an
 * already-parsed body is handed back untouched, otherwise the raw stream is
 * read. An empty body yields \`undefined\` instead of throwing, mirroring the
 * client's defensive \`readOptionalJsonBody\`.
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
 * An \`HttpError\` maps to its own status and body. Anything else is an internal
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
 * \`body\` is already-marshalled JSON text — a model's \`marshal()\` returns a
 * string and applies the wire-name mapping, so \`send\` is correct here and
 * \`json\` would double-encode it. \`undefined\` sends no body at all.
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
// ============================================================================`;
}
