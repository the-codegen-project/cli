/**
 * Source fragments the HTTP client and HTTP server protocols both emit.
 *
 * Two copies in the *generated output* are correct — `http_client.ts` and
 * `http_server.ts` are independent modules and neither may import from the
 * other. Two copies in the *generator* are not, so the fragments live here.
 */

/**
 * Standard HTTP reason phrases, keyed by status code. Deterministic and
 * collision-free across operations that declare the same code.
 */
export const HTTP_REASON_PHRASES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required'
};

/**
 * The `HttpGlobalError` alias block. Every generated HTTP module opens with it
 * so nothing has to reference the ambient `Error` binding by its bare name.
 */
export const HTTP_GLOBAL_ERROR_ALIAS = `/**
 * The global \`Error\`, captured under a name a payload model cannot take.
 *
 * A document is free to declare a schema called \`Error\` (it is the
 * conventional name for one), and its generated model is imported into this
 * module, shadowing the global for the whole file. Every reference below goes
 * through these aliases so that is harmless.
 */
const HttpGlobalError = globalThis.Error;
type HttpGlobalError = InstanceType<typeof globalThis.Error>;`;

/**
 * The `HttpError` class both protocols emit. The body is identical on both
 * sides — only the doc comment differs, because the client *throws* it on a
 * non-OK response while the server *catches* it to build one.
 */
export function renderHttpErrorClass(description: string): string {
  return `${description}
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
}`;
}
