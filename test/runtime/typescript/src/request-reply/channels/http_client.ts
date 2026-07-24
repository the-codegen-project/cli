import {Pong, PongInterface} from './../payloads/Pong';
import {Ping, PingInterface} from './../payloads/Ping';
import * as MultiStatusResponseReplyPayloadModule from './../payloads/MultiStatusResponseReplyPayload';
import * as GetUserItemReplyPayloadModule from './../payloads/GetUserItemReplyPayload';
import * as UpdateUserItemReplyPayloadModule from './../payloads/UpdateUserItemReplyPayload';
import {ItemRequest, ItemRequestInterface} from './../payloads/ItemRequest';
import * as PingPayloadModule from './../payloads/PingPayload';
import * as UserItemsPayloadModule from './../payloads/UserItemsPayload';
import {NotFound, NotFoundInterface} from './../payloads/NotFound';
import {ItemResponse, ItemResponseInterface} from './../payloads/ItemResponse';
import {UserItemsParameters, UserItemsParametersInterface} from './../parameters/UserItemsParameters';
import {UserItemsHeaders} from './../headers/UserItemsHeaders';

// ============================================================================
// Common Types - Shared across all HTTP client functions
// ============================================================================

/**
 * Standard HTTP response interface that wraps fetch-like responses
 */
export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers?: Headers | Record<string, string>;
  json: () => Record<any, any> | Promise<Record<any, any>>;
}

/**
 * Rich response wrapper returned by HTTP client functions
 */
export interface HttpClientResponse<T> {
  /** The deserialized response payload */
  data: T;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Raw JSON response before deserialization */
  rawData: Record<string, any>;
}

/**
 * Error thrown for non-OK HTTP responses.
 *
 * Carries the HTTP `status`, `statusText`, and the parsed response `body`
 * (when the error response had a JSON body). Thrown by `handleHttpError` and
 * routed through the `onError` hook / retry logic unchanged.
 */
export class HttpError extends Error {
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
 * HTTP request parameters passed to the request hook
 */
export interface HttpRequestParams {
  url: string;
  headers?: Record<string, string | string[]>;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  credentials?: 'omit' | 'include' | 'same-origin';
  body?: any;
}

/**
 * Token response structure for OAuth2 flows
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

// ============================================================================
// Security Configuration Types - Grouped for better autocomplete
// ============================================================================

/**
 * Bearer token authentication configuration
 */
export interface BearerAuth {
  type: 'bearer';
  token: string;
}

/**
 * Basic authentication configuration (username/password)
 */
export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

/**
 * API key authentication configuration
 */
export interface ApiKeyAuth {
  type: 'apiKey';
  key: string;
  name?: string;        // Name of the API key parameter (default: 'X-API-Key')
  in?: 'header' | 'query'; // Where to place the API key (default: 'header')
}

/**
 * OAuth2 authentication configuration
 *
 * Supports server-side flows only:
 * - client_credentials: Server-to-server authentication
 * - password: Resource owner password credentials (legacy, not recommended)
 * - Pre-obtained accessToken: For tokens obtained via browser-based flows
 *
 * For browser-based flows (implicit, authorization_code), obtain the token
 * separately and pass it as accessToken.
 */
export interface OAuth2Auth {
  type: 'oauth2';
  /** Pre-obtained access token (required if not using a server-side flow) */
  accessToken?: string;
  /** Refresh token for automatic token renewal on 401 */
  refreshToken?: string;
  /** Token endpoint URL (required for client_credentials/password flows and token refresh) */
  tokenUrl?: string;
  /** Client ID (required for flows and token refresh) */
  clientId?: string;
  /** Client secret (optional, depends on OAuth provider) */
  clientSecret?: string;
  /** Requested scopes */
  scopes?: string[];
  /** Server-side flow type */
  flow?: 'password' | 'client_credentials';
  /** Username for password flow */
  username?: string;
  /** Password for password flow */
  password?: string;
  /** Callback when tokens are refreshed (for caching/persistence) */
  onTokenRefresh?: (newTokens: TokenResponse) => void;
}

/**
 * Union type for all authentication methods - provides autocomplete support
 */
export type AuthConfig = BearerAuth | BasicAuth | ApiKeyAuth | OAuth2Auth;

/**
 * Feature flags indicating which auth types are available.
 * Used internally to conditionally call auth-specific helpers.
 */
const AUTH_FEATURES = {
  oauth2: true
} as const;

/**
 * Default values for API key authentication derived from the spec.
 * These match the defaults documented in the ApiKeyAuth interface.
 */
const API_KEY_DEFAULTS = {
  name: 'X-API-Key',
  in: 'header' as 'header' | 'query' | 'cookie'
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Retry policy configuration for failed requests
 */
export interface RetryConfig {
  maxRetries?: number;           // Maximum number of retry attempts (default: 3)
  initialDelayMs?: number;       // Initial delay before first retry (default: 1000)
  maxDelayMs?: number;           // Maximum delay between retries (default: 30000)
  backoffMultiplier?: number;    // Multiplier for exponential backoff (default: 2)
  retryableStatusCodes?: number[]; // Status codes to retry (default: [408, 429, 500, 502, 503, 504])
  retryOnNetworkError?: boolean; // Retry on network errors (default: true)
  onRetry?: (attempt: number, delay: number, error: Error) => void; // Callback on each retry
}

// ============================================================================
// Hooks Configuration - Extensible callback system
// ============================================================================

/**
 * Hooks for customizing HTTP client behavior
 */
export interface HttpHooks {
  /**
   * Called before each request to transform/modify the request parameters
   * Return modified params or undefined to use original
   */
  beforeRequest?: (params: HttpRequestParams) => HttpRequestParams | Promise<HttpRequestParams>;

  /**
   * The actual request implementation - allows swapping fetch for axios, etc.
   * Default: uses the global fetch (Node.js 18+)
   */
  makeRequest?: (params: HttpRequestParams) => Promise<HttpResponse>;

  /**
   * Called after each response for logging, metrics, etc.
   * Can transform the response before it's processed
   */
  afterResponse?: (response: HttpResponse, params: HttpRequestParams) => HttpResponse | Promise<HttpResponse>;

  /**
   * Called on request error for logging, error transformation, etc.
   */
  onError?: (error: Error, params: HttpRequestParams) => Error | Promise<Error>;
}

// ============================================================================
// Common Request Context
// ============================================================================

/**
 * Base context shared by all HTTP client functions
 */
export interface HttpClientContext {
  baseUrl?: string;

  // Authentication - grouped for better autocomplete
  auth?: AuthConfig;

  // Retry configuration
  retry?: RetryConfig;

  // Hooks for extensibility
  hooks?: HttpHooks;

  // Additional options
  additionalHeaders?: Record<string, string | string[]>;

  // Extra query parameters not covered by the typed parameters interface
  additionalQueryParams?: Record<string, string | number | boolean | undefined>;
}

// ============================================================================
// Helper Functions - Shared logic extracted for reuse
// ============================================================================

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
  onRetry: () => {},
};

/**
 * Default request hook implementation using the global fetch (Node.js 18+)
 */
const defaultMakeRequest = async (params: HttpRequestParams): Promise<HttpResponse> => {
  // Build a Headers object so multi-value headers (string[]) are preserved -
  // the global fetch's HeadersInit only accepts string values in a plain object.
  const headers = new Headers();
  for (const [name, value] of Object.entries(params.headers ?? {})) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(name, entry);
      }
    } else {
      headers.set(name, value);
    }
  }
  return fetch(params.url, {
    body: params.body,
    method: params.method,
    headers
  }) as unknown as HttpResponse;
};

/**
 * Apply authentication to headers and URL based on auth config
 */
function applyAuth(
  auth: AuthConfig | undefined,
  headers: Record<string, string | string[]>,
  url: string
): { headers: Record<string, string | string[]>; url: string } {
  if (!auth) return { headers, url };

  switch (auth.type) {
    case 'bearer':
      headers['Authorization'] = `Bearer ${auth.token}`;
      break;

    case 'basic': {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
      break;
    }

    case 'apiKey': {
      const keyName = auth.name ?? API_KEY_DEFAULTS.name;
      const keyIn = auth.in ?? API_KEY_DEFAULTS.in;

      if (keyIn === 'header') {
        headers[keyName] = auth.key;
      } else if (keyIn === 'query') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${keyName}=${encodeURIComponent(auth.key)}`;
      } else if (keyIn === 'cookie') {
        headers['Cookie'] = `${keyName}=${auth.key}`;
      }
      break;
    }

    case 'oauth2': {
      // If we have an access token, use it directly
      // Token flows (client_credentials, password) are handled separately
      if (auth.accessToken) {
        headers['Authorization'] = `Bearer ${auth.accessToken}`;
      }
      break;
    }
  }

  return { headers, url };
}

/**
 * Apply query parameters to URL
 */
function applyQueryParams(queryParams: Record<string, string | number | boolean | undefined> | undefined, url: string): string {
  if (!queryParams) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  const paramString = params.toString();
  if (!paramString) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramString}`;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateBackoffDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Determine if a request should be retried based on error/response
 */
function shouldRetry(
  error: Error | null,
  response: HttpResponse | null,
  config: Required<RetryConfig>,
  attempt: number
): boolean {
  if (attempt >= config.maxRetries) return false;

  if (error && config.retryOnNetworkError) return true;

  if (response && config.retryableStatusCodes.includes(response.status)) return true;

  return false;
}

/**
 * Execute request with retry logic
 */
async function executeWithRetry(
  params: HttpRequestParams,
  makeRequest: (params: HttpRequestParams) => Promise<HttpResponse>,
  retryConfig?: RetryConfig
): Promise<HttpResponse> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;
  let lastResponse: HttpResponse | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateBackoffDelay(attempt, config);
        config.onRetry(attempt, delay, lastError ?? new Error('Retry attempt'));
        await sleep(delay);
      }

      const response = await makeRequest(params);

      // Check if we should retry this response
      if (!shouldRetry(null, response, config, attempt + 1)) {
        return response;
      }

      lastResponse = response;
      lastError = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!shouldRetry(lastError, null, config, attempt + 1)) {
        throw lastError;
      }
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return lastResponse;
  }
  throw lastError ?? new Error('Request failed after retries');
}

/**
 * Handle HTTP error status codes by throwing a typed HttpError.
 * Explicit cases are generated from the error status codes declared by the
 * input document; undeclared codes fall through to the default handler.
 */
function handleHttpError(status: number, statusText: string, body?: unknown): never {
  throw new HttpError(`HTTP Error: ${status} ${statusText}`, status, statusText, body);
}

/**
 * Extract headers from response into a plain object
 */
function extractHeaders(response: HttpResponse): Record<string, string> {
  const headers: Record<string, string> = {};

  if (response.headers) {
    if (typeof (response.headers as any).forEach === 'function') {
      // Headers object (fetch API)
      (response.headers as Headers).forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
    } else {
      // Plain object
      for (const [key, value] of Object.entries(response.headers)) {
        headers[key.toLowerCase()] = value;
      }
    }
  }

  return headers;
}

/**
 * Builds a URL with path parameters replaced
 * @param server - Base server URL
 * @param pathTemplate - Path template with {param} placeholders
 * @param parameters - Parameter object with getChannelWithParameters method
 */
function buildUrlWithParameters<T extends { getChannelWithParameters: (path: string) => string }>(
  server: string,
  pathTemplate: string,
  parameters: T
): string {
  const path = parameters.getChannelWithParameters(pathTemplate);
  return `${server}${path}`;
}

/**
 * Extracts headers from a typed headers object and merges with additional headers
 */
function applyTypedHeaders(
  typedHeaders: { marshal: () => string } | undefined,
  additionalHeaders: Record<string, string | string[]> | undefined
): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  if (typedHeaders) {
    // Parse the marshalled headers and merge them
    const marshalledHeaders = JSON.parse(typedHeaders.marshal());
    for (const [key, value] of Object.entries(marshalledHeaders)) {
      headers[key] = value as string;
    }
  }

  return headers;
}

/**
 * Validate OAuth2 configuration based on flow type
 */
function validateOAuth2Config(auth: OAuth2Auth): void {
  // If using a flow, validate required fields
  switch (auth.flow) {
    case 'client_credentials':
      if (!auth.tokenUrl) throw new Error('OAuth2 Client Credentials flow requires tokenUrl');
      if (!auth.clientId) throw new Error('OAuth2 Client Credentials flow requires clientId');
      break;

    case 'password':
      if (!auth.tokenUrl) throw new Error('OAuth2 Password flow requires tokenUrl');
      if (!auth.clientId) throw new Error('OAuth2 Password flow requires clientId');
      if (!auth.username) throw new Error('OAuth2 Password flow requires username');
      if (!auth.password) throw new Error('OAuth2 Password flow requires password');
      break;

    default:
      // No flow specified - must have accessToken for OAuth2 to work
      if (!auth.accessToken && !auth.flow) {
        // This is fine - token refresh can still work if refreshToken is provided
        // Or the request will just be made without auth
      }
      break;
  }
}

/**
 * Handle OAuth2 token flows (client_credentials, password)
 */
async function handleOAuth2TokenFlow(
  auth: OAuth2Auth,
  originalParams: HttpRequestParams,
  makeRequest: (params: HttpRequestParams) => Promise<HttpResponse>,
  retryConfig?: RetryConfig
): Promise<HttpResponse | null> {
  if (!auth.flow || !auth.tokenUrl) return null;

  const params = new URLSearchParams();

  if (auth.flow === 'client_credentials') {
    params.append('grant_type', 'client_credentials');
    params.append('client_id', auth.clientId!);
  } else if (auth.flow === 'password') {
    params.append('grant_type', 'password');
    params.append('username', auth.username || '');
    params.append('password', auth.password || '');
    params.append('client_id', auth.clientId!);
  } else {
    return null;
  }

  if (auth.clientSecret) {
    params.append('client_secret', auth.clientSecret);
  }
  if (auth.scopes && auth.scopes.length > 0) {
    params.append('scope', auth.scopes.join(' '));
  }

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  // Use basic auth for client credentials if both client ID and secret are provided
  if (auth.flow === 'client_credentials' && auth.clientId && auth.clientSecret) {
    const credentials = Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString('base64');
    authHeaders['Authorization'] = `Basic ${credentials}`;
    params.delete('client_id');
    params.delete('client_secret');
  }

  const tokenResponse = await fetch(auth.tokenUrl, {
    method: 'POST',
    headers: authHeaders,
    body: params.toString()
  });

  if (!tokenResponse.ok) {
    throw new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  const tokens: TokenResponse = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in
  };

  // Notify the client about the tokens
  if (auth.onTokenRefresh) {
    auth.onTokenRefresh(tokens);
  }

  // Retry the original request with the new token
  const updatedHeaders = { ...originalParams.headers };
  updatedHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;

  return executeWithRetry({ ...originalParams, headers: updatedHeaders }, makeRequest, retryConfig);
}

/**
 * Handle OAuth2 token refresh on 401 response
 */
async function handleTokenRefresh(
  auth: OAuth2Auth,
  originalParams: HttpRequestParams,
  makeRequest: (params: HttpRequestParams) => Promise<HttpResponse>,
  retryConfig?: RetryConfig
): Promise<HttpResponse | null> {
  if (!auth.refreshToken || !auth.tokenUrl || !auth.clientId) return null;

  const refreshResponse = await fetch(auth.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
      client_id: auth.clientId,
      ...(auth.clientSecret ? { client_secret: auth.clientSecret } : {})
    }).toString()
  });

  if (!refreshResponse.ok) {
    throw new Error('Unauthorized');
  }

  const tokenData = await refreshResponse.json();
  const newTokens: TokenResponse = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || auth.refreshToken,
    expiresIn: tokenData.expires_in
  };

  // Notify the client about the refreshed tokens
  if (auth.onTokenRefresh) {
    auth.onTokenRefresh(newTokens);
  }

  // Retry the original request with the new token
  const updatedHeaders = { ...originalParams.headers };
  updatedHeaders['Authorization'] = `Bearer ${newTokens.accessToken}`;

  return executeWithRetry({ ...originalParams, headers: updatedHeaders }, makeRequest, retryConfig);
}
// ============================================================================
// Generated HTTP Client Functions
// ============================================================================

export interface PostPingPostRequestContext extends HttpClientContext {
  payload: PingInterface | Ping;
}

/**
 * HTTP POST request to /ping
 */
async function postPingPostRequest(context: PostPingPostRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const payload = context.payload instanceof Ping ? context.payload : new Ping(context.payload);
  const body = payload?.marshal();

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'POST',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface GetPingGetRequestContext extends HttpClientContext {}

/**
 * HTTP GET request to /ping
 */
async function getPingGetRequest(context: GetPingGetRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'GET',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface PutPingPutRequestContext extends HttpClientContext {
  payload: PingInterface | Ping;
}

/**
 * HTTP PUT request to /ping
 */
async function putPingPutRequest(context: PutPingPutRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const payload = context.payload instanceof Ping ? context.payload : new Ping(context.payload);
  const body = payload?.marshal();

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'PUT',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface DeletePingDeleteRequestContext extends HttpClientContext {}

/**
 * HTTP DELETE request to /ping
 */
async function deletePingDeleteRequest(context: DeletePingDeleteRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'DELETE',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface PatchPingPatchRequestContext extends HttpClientContext {
  payload: PingInterface | Ping;
}

/**
 * HTTP PATCH request to /ping
 */
async function patchPingPatchRequest(context: PatchPingPatchRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const payload = context.payload instanceof Ping ? context.payload : new Ping(context.payload);
  const body = payload?.marshal();

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'PATCH',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface HeadPingHeadRequestContext extends HttpClientContext {}

/**
 * HTTP HEAD request to /ping
 */
async function headPingHeadRequest(context: HeadPingHeadRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'HEAD',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface OptionsPingOptionsRequestContext extends HttpClientContext {}

/**
 * HTTP OPTIONS request to /ping
 */
async function optionsPingOptionsRequest(context: OptionsPingOptionsRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'OPTIONS',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(JSON.stringify(rawData));

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface GetMultiStatusResponseContext extends HttpClientContext {}

/**
 * HTTP GET request to /ping
 */
async function getMultiStatusResponse(context: GetMultiStatusResponseContext = {}): Promise<HttpClientResponse<MultiStatusResponseReplyPayloadModule.MultiStatusResponseReplyPayload>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.baseUrl}/ping`;
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'GET',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(JSON.stringify(rawData), response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<MultiStatusResponseReplyPayloadModule.MultiStatusResponseReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface GetGetUserItemContext extends HttpClientContext {
  parameters: UserItemsParametersInterface | UserItemsParameters;
  requestHeaders?: ItemRequestHeaders | ItemResponseHeaders;
}

/**
 * HTTP GET request to /users/{userId}/items/{itemId}
 */
async function getGetUserItem(context: GetGetUserItemContext): Promise<HttpClientResponse<GetUserItemReplyPayloadModule.GetUserItemReplyPayload>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  const parameters = context.parameters instanceof UserItemsParameters ? context.parameters : new UserItemsParameters(context.parameters);

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = buildUrlWithParameters(config.baseUrl, '/users/{userId}/items/{itemId}', parameters);
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = undefined;

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'GET',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = GetUserItemReplyPayloadModule.unmarshalByStatusCode(JSON.stringify(rawData), response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<GetUserItemReplyPayloadModule.GetUserItemReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export interface PutUpdateUserItemContext extends HttpClientContext {
  payload: ItemRequestInterface | ItemRequest;
  parameters: UserItemsParametersInterface | UserItemsParameters;
  requestHeaders?: ItemRequestHeaders | ItemResponseHeaders;
}

/**
 * HTTP PUT request to /users/{userId}/items/{itemId}
 */
async function putUpdateUserItem(context: PutUpdateUserItemContext): Promise<HttpClientResponse<UpdateUserItemReplyPayloadModule.UpdateUserItemReplyPayload>> {
  // Apply defaults
  const config = {
    baseUrl: 'http://localhost:3000',
    ...context,
  };

  const parameters = context.parameters instanceof UserItemsParameters ? context.parameters : new UserItemsParameters(context.parameters);

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = buildUrlWithParameters(config.baseUrl, '/users/{userId}/items/{itemId}', parameters);
  url = applyQueryParams(config.additionalQueryParams, url);

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const payload = context.payload instanceof ItemRequest ? context.payload : new ItemRequest(context.payload);
  const body = payload?.marshal();

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: 'PUT',
    headers,
    body
  };

  // Apply beforeRequest hook
  if (config.hooks?.beforeRequest) {
    requestParams = await config.hooks.beforeRequest(requestParams);
  }

  try {
    // Execute request with retry logic
    let response = await executeWithRetry(requestParams, makeRequest, config.retry);

    // Apply afterResponse hook
    if (config.hooks?.afterResponse) {
      response = await config.hooks.afterResponse(response, requestParams);
    }

    // Handle OAuth2 token flows that require getting a token first
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken && AUTH_FEATURES.oauth2) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
      try {
        const refreshResponse = await handleTokenRefresh(config.auth, requestParams, makeRequest, config.retry);
        if (refreshResponse) {
          response = refreshResponse;
        }
      } catch {
        throw new Error('Unauthorized');
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      handleHttpError(response.status, response.statusText, errorBody);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = UpdateUserItemReplyPayloadModule.unmarshalByStatusCode(JSON.stringify(rawData), response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);

    const result: HttpClientResponse<UpdateUserItemReplyPayloadModule.UpdateUserItemReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}

export { postPingPostRequest, getPingGetRequest, putPingPutRequest, deletePingDeleteRequest, patchPingPatchRequest, headPingHeadRequest, optionsPingOptionsRequest, getMultiStatusResponse, getGetUserItem, putUpdateUserItem };
