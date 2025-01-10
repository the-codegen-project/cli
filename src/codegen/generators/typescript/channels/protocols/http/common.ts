export function renderCommonHttpCode() {
  return `type RequestCredentials = "omit" | "include" | "same-origin";
export type Json = any;
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type HTTPHeaders = { [key: string]: string };
export type HTTPQuery = { [key: string]: string | number | null | boolean | Array<string | number | null | boolean> | Set<string | number | null | boolean> | HTTPQuery };
export type HTTPBody = Json | URLSearchParams;
export type HTTPRequestInit = { headers?: HTTPHeaders; method: HTTPMethod; credentials?: RequestCredentials; body?: HTTPBody };

export interface FetchCallbackResponse {
  ok: boolean,
  status: number,
  statusText: string,
  json: () => Record<any, any> | Promise<Record<any, any>>,
}
export type FetchCallback = (url: string, options: HTTPRequestInit) => FetchCallbackResponse | Promise<FetchCallbackResponse>;

export interface RequestContext<RequestPayload> {
  payload: RequestPayload,
  basePath?: string; // override base path
  server?: 'http://localhost:3000'
  //username?: string; // parameter for basic security
  //password?: string; // parameter for basic security
  //apiKey?: string | ((name: string) => string | Promise<string>); // parameter for apiKey security
  accessToken?: string | ((name?: string, scopes?: string[]) => string | Promise<string>); // parameter for oauth2 security
  credentials?: RequestCredentials; //value for the credentials param we want to use on each request
  additionalHeaders?: HTTPHeaders; //header params we want to use on every request,
  fetch?: FetchCallback
}
export interface InternalRequestContext<RequestPayload> {
  payload: RequestPayload,
  basePath: string; // override base path
  server?: 'http://localhost:3000'
  //username?: string; // parameter for basic security
  //password?: string; // parameter for basic security
  //apiKey?: string | ((name: string) => string | Promise<string>); // parameter for apiKey security
  accessToken?: string | ((name?: string, scopes?: string[]) => string | Promise<string>); // parameter for oauth2 security
  credentials?: RequestCredentials; //value for the credentials param we want to use on each request
  additionalHeaders?: HTTPHeaders; //header params we want to use on every request,
  fetch: FetchCallback
}
export class FetchError extends Error {
  override name = "FetchError";
  code: number;
  constructor(public cause: Error, code: number, msg: string) {
    super(msg);
    this.code = code;
  }
}`;
}
