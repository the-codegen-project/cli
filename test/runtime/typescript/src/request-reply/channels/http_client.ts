import {Pong} from './../payloads/Pong';
import {Ping} from './../payloads/Ping';
import * as MultiStatusResponseReplyPayloadModule from './../payloads/MultiStatusResponseReplyPayload';
import * as GetUserItemReplyPayloadModule from './../payloads/GetUserItemReplyPayload';
import * as UpdateUserItemReplyPayloadModule from './../payloads/UpdateUserItemReplyPayload';
import {ItemRequest} from './../payloads/ItemRequest';
import * as PingPayloadModule from './../payloads/PingPayload';
import * as UserItemsPayloadModule from './../payloads/UserItemsPayload';
import {NotFound} from './../payloads/NotFound';
import {ItemResponse} from './../payloads/ItemResponse';
import {UserItemsParameters} from './../parameters/UserItemsParameters';
import {ItemRequestHeaders} from './../headers/ItemRequestHeaders';
import { URLSearchParams, URL } from 'url';
import * as NodeFetch from 'node-fetch';

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
 * Pagination info extracted from response
 */
export interface PaginationInfo {
  /** Total number of items (if available from headers like X-Total-Count) */
  totalCount?: number;
  /** Total number of pages (if available) */
  totalPages?: number;
  /** Current page/offset */
  currentOffset?: number;
  /** Items per page */
  limit?: number;
  /** Next cursor (for cursor-based pagination) */
  nextCursor?: string;
  /** Previous cursor */
  prevCursor?: string;
  /** Whether there are more items */
  hasMore?: boolean;
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
  /** Pagination info extracted from response (if applicable) */
  pagination?: PaginationInfo;
  /** Fetch the next page (if pagination is configured and more data exists) */
  getNextPage?: () => Promise<HttpClientResponse<T>>;
  /** Fetch the previous page (if pagination is configured) */
  getPrevPage?: () => Promise<HttpClientResponse<T>>;
  /** Check if there's a next page */
  hasNextPage?: () => boolean;
  /** Check if there's a previous page */
  hasPrevPage?: () => boolean;
}

/**
 * HTTP request parameters passed to the request hook
 */
export interface HttpRequestParams {
  url: string;
  headers?: Record<string, string | string[]>;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  credentials?: RequestCredentials;
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

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Where to place pagination parameters
 */
export type PaginationLocation = 'query' | 'header';

/**
 * Offset-based pagination configuration
 */
export interface OffsetPagination {
  type: 'offset';
  in?: PaginationLocation;  // Where to place params (default: 'query')
  offset: number;
  limit: number;
  offsetParam?: string;  // Param name for offset (default: 'offset' for query, 'X-Offset' for header)
  limitParam?: string;   // Param name for limit (default: 'limit' for query, 'X-Limit' for header)
}

/**
 * Cursor-based pagination configuration
 */
export interface CursorPagination {
  type: 'cursor';
  in?: PaginationLocation;  // Where to place params (default: 'query')
  cursor?: string;
  limit?: number;
  cursorParam?: string;  // Param name for cursor (default: 'cursor' for query, 'X-Cursor' for header)
  limitParam?: string;   // Param name for limit (default: 'limit' for query, 'X-Limit' for header)
}

/**
 * Page-based pagination configuration
 */
export interface PagePagination {
  type: 'page';
  in?: PaginationLocation;  // Where to place params (default: 'query')
  page: number;
  pageSize: number;
  pageParam?: string;     // Param name for page (default: 'page' for query, 'X-Page' for header)
  pageSizeParam?: string; // Param name for page size (default: 'pageSize' for query, 'X-Page-Size' for header)
}

/**
 * Range-based pagination (typically used with headers)
 * Follows RFC 7233 style: Range: items=0-24
 */
export interface RangePagination {
  type: 'range';
  in?: 'header';  // Range pagination is typically header-only
  start: number;
  end: number;
  unit?: string;        // Range unit (default: 'items')
  rangeHeader?: string; // Header name (default: 'Range')
}

/**
 * Union type for all pagination methods
 */
export type PaginationConfig = OffsetPagination | CursorPagination | PagePagination | RangePagination;

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
   * Default: uses node-fetch
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
  server?: string;
  path?: string;

  // Authentication - grouped for better autocomplete
  auth?: AuthConfig;

  // Pagination configuration
  pagination?: PaginationConfig;

  // Retry configuration
  retry?: RetryConfig;

  // Hooks for extensibility
  hooks?: HttpHooks;

  // Additional options
  additionalHeaders?: Record<string, string | string[]>;

  // Query parameters
  queryParams?: Record<string, string | number | boolean | undefined>;
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
 * Default request hook implementation using node-fetch
 */
const defaultMakeRequest = async (params: HttpRequestParams): Promise<HttpResponse> => {
  return NodeFetch.default(params.url, {
    body: params.body,
    method: params.method,
    headers: params.headers
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
      const keyName = auth.name ?? 'X-API-Key';
      const keyIn = auth.in ?? 'header';

      if (keyIn === 'header') {
        headers[keyName] = auth.key;
      } else {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${keyName}=${encodeURIComponent(auth.key)}`;
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
 * Apply pagination parameters to URL and/or headers based on configuration
 */
function applyPagination(
  pagination: PaginationConfig | undefined,
  url: string,
  headers: Record<string, string | string[]>
): { url: string; headers: Record<string, string | string[]> } {
  if (!pagination) return { url, headers };

  const location = pagination.in ?? 'query';
  const isHeader = location === 'header';

  // Helper to get default param names based on location
  const getDefaultName = (queryName: string, headerName: string) =>
    isHeader ? headerName : queryName;

  const queryParams = new URLSearchParams();
  const headerParams: Record<string, string> = {};

  const addParam = (name: string, value: string) => {
    if (isHeader) {
      headerParams[name] = value;
    } else {
      queryParams.append(name, value);
    }
  };

  switch (pagination.type) {
    case 'offset':
      addParam(
        pagination.offsetParam ?? getDefaultName('offset', 'X-Offset'),
        String(pagination.offset)
      );
      addParam(
        pagination.limitParam ?? getDefaultName('limit', 'X-Limit'),
        String(pagination.limit)
      );
      break;

    case 'cursor':
      if (pagination.cursor) {
        addParam(
          pagination.cursorParam ?? getDefaultName('cursor', 'X-Cursor'),
          pagination.cursor
        );
      }
      if (pagination.limit !== undefined) {
        addParam(
          pagination.limitParam ?? getDefaultName('limit', 'X-Limit'),
          String(pagination.limit)
        );
      }
      break;

    case 'page':
      addParam(
        pagination.pageParam ?? getDefaultName('page', 'X-Page'),
        String(pagination.page)
      );
      addParam(
        pagination.pageSizeParam ?? getDefaultName('pageSize', 'X-Page-Size'),
        String(pagination.pageSize)
      );
      break;

    case 'range': {
      // Range pagination is always header-based (RFC 7233 style)
      const unit = pagination.unit ?? 'items';
      const headerName = pagination.rangeHeader ?? 'Range';
      headerParams[headerName] = `${unit}=${pagination.start}-${pagination.end}`;
      break;
    }
  }

  // Apply query params to URL
  const queryString = queryParams.toString();
  if (queryString) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${queryString}`;
  }

  // Merge header params
  const updatedHeaders = { ...headers, ...headerParams };

  return { url, headers: updatedHeaders };
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

  const tokenResponse = await NodeFetch.default(auth.tokenUrl, {
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

  const refreshResponse = await NodeFetch.default(auth.tokenUrl, {
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

/**
 * Handle HTTP error status codes with standardized messages
 */
function handleHttpError(status: number, statusText: string): never {
  switch (status) {
    case 401:
      throw new Error('Unauthorized');
    case 403:
      throw new Error('Forbidden');
    case 404:
      throw new Error('Not Found');
    case 500:
      throw new Error('Internal Server Error');
    default:
      throw new Error(`HTTP Error: ${status} ${statusText}`);
  }
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
 * Extract pagination info from response headers
 */
function extractPaginationInfo(
  headers: Record<string, string>,
  currentPagination?: PaginationConfig
): PaginationInfo | undefined {
  const info: PaginationInfo = {};
  let hasPaginationInfo = false;

  // Common total count headers
  const totalCount = headers['x-total-count'] || headers['x-total'] || headers['total-count'];
  if (totalCount) {
    info.totalCount = parseInt(totalCount, 10);
    hasPaginationInfo = true;
  }

  // Total pages
  const totalPages = headers['x-total-pages'] || headers['x-page-count'];
  if (totalPages) {
    info.totalPages = parseInt(totalPages, 10);
    hasPaginationInfo = true;
  }

  // Next cursor
  const nextCursor = headers['x-next-cursor'] || headers['x-cursor-next'];
  if (nextCursor) {
    info.nextCursor = nextCursor;
    info.hasMore = true;
    hasPaginationInfo = true;
  }

  // Previous cursor
  const prevCursor = headers['x-prev-cursor'] || headers['x-cursor-prev'];
  if (prevCursor) {
    info.prevCursor = prevCursor;
    hasPaginationInfo = true;
  }

  // Has more indicator
  const hasMore = headers['x-has-more'] || headers['x-has-next'];
  if (hasMore) {
    info.hasMore = hasMore.toLowerCase() === 'true' || hasMore === '1';
    hasPaginationInfo = true;
  }

  // Parse Link header (RFC 5988)
  const linkHeader = headers['link'];
  if (linkHeader) {
    const links = parseLinkHeader(linkHeader);
    if (links.next) {
      info.hasMore = true;
      hasPaginationInfo = true;
    }
  }

  // Include current pagination state
  if (currentPagination) {
    switch (currentPagination.type) {
      case 'offset':
        info.currentOffset = currentPagination.offset;
        info.limit = currentPagination.limit;
        break;
      case 'cursor':
        info.limit = currentPagination.limit;
        break;
      case 'page':
        info.currentOffset = (currentPagination.page - 1) * currentPagination.pageSize;
        info.limit = currentPagination.pageSize;
        break;
      case 'range':
        info.currentOffset = currentPagination.start;
        info.limit = currentPagination.end - currentPagination.start + 1;
        break;
    }
    hasPaginationInfo = true;
  }

  // Calculate hasMore based on total count
  if (info.hasMore === undefined && info.totalCount !== undefined &&
      info.currentOffset !== undefined && info.limit !== undefined) {
    info.hasMore = info.currentOffset + info.limit < info.totalCount;
  }

  return hasPaginationInfo ? info : undefined;
}

/**
 * Parse RFC 5988 Link header
 */
function parseLinkHeader(header: string): Record<string, string> {
  const links: Record<string, string> = {};
  const parts = header.split(',');

  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="?([^";\s]+)"?/);
    if (match) {
      links[match[2]] = match[1];
    }
  }

  return links;
}

/**
 * Create pagination helper functions for the response
 */
function createPaginationHelpers<T, TContext extends HttpClientContext>(
  currentConfig: TContext,
  paginationInfo: PaginationInfo | undefined,
  requestFn: (config: TContext) => Promise<HttpClientResponse<T>>
): Pick<HttpClientResponse<T>, 'getNextPage' | 'getPrevPage' | 'hasNextPage' | 'hasPrevPage'> {
  const helpers: Pick<HttpClientResponse<T>, 'getNextPage' | 'getPrevPage' | 'hasNextPage' | 'hasPrevPage'> = {};

  if (!currentConfig.pagination) {
    return helpers;
  }

  const pagination = currentConfig.pagination;

  helpers.hasNextPage = () => {
    if (paginationInfo?.hasMore !== undefined) return paginationInfo.hasMore;
    if (paginationInfo?.nextCursor) return true;
    if (paginationInfo?.totalCount !== undefined &&
        paginationInfo.currentOffset !== undefined &&
        paginationInfo.limit !== undefined) {
      return paginationInfo.currentOffset + paginationInfo.limit < paginationInfo.totalCount;
    }
    return false;
  };

  helpers.hasPrevPage = () => {
    if (paginationInfo?.prevCursor) return true;
    if (paginationInfo?.currentOffset !== undefined) {
      return paginationInfo.currentOffset > 0;
    }
    return false;
  };

  helpers.getNextPage = async () => {
    let nextPagination: PaginationConfig;

    switch (pagination.type) {
      case 'offset':
        nextPagination = { ...pagination, offset: pagination.offset + pagination.limit };
        break;
      case 'cursor':
        if (!paginationInfo?.nextCursor) throw new Error('No next cursor available');
        nextPagination = { ...pagination, cursor: paginationInfo.nextCursor };
        break;
      case 'page':
        nextPagination = { ...pagination, page: pagination.page + 1 };
        break;
      case 'range':
        const rangeSize = pagination.end - pagination.start + 1;
        nextPagination = { ...pagination, start: pagination.end + 1, end: pagination.end + rangeSize };
        break;
      default:
        throw new Error('Unsupported pagination type');
    }

    return requestFn({ ...currentConfig, pagination: nextPagination });
  };

  helpers.getPrevPage = async () => {
    let prevPagination: PaginationConfig;

    switch (pagination.type) {
      case 'offset':
        prevPagination = { ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) };
        break;
      case 'cursor':
        if (!paginationInfo?.prevCursor) throw new Error('No previous cursor available');
        prevPagination = { ...pagination, cursor: paginationInfo.prevCursor };
        break;
      case 'page':
        prevPagination = { ...pagination, page: Math.max(1, pagination.page - 1) };
        break;
      case 'range':
        const size = pagination.end - pagination.start + 1;
        const newStart = Math.max(0, pagination.start - size);
        prevPagination = { ...pagination, start: newStart, end: newStart + size - 1 };
        break;
      default:
        throw new Error('Unsupported pagination type');
    }

    return requestFn({ ...currentConfig, pagination: prevPagination });
  };

  return helpers;
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

// ============================================================================
// Generated HTTP Client Functions
// ============================================================================

export interface PostPingPostRequestContext extends HttpClientContext {
  payload: Ping;
  requestHeaders?: { marshal: () => string };
}

async function postPingPostRequest(context: PostPingPostRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = context.payload?.marshal();

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, postPingPostRequest),
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

export interface GetPingGetRequestContext extends HttpClientContext {
  requestHeaders?: { marshal: () => string };
}

async function getPingGetRequest(context: GetPingGetRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, getPingGetRequest),
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
  payload: Ping;
  requestHeaders?: { marshal: () => string };
}

async function putPingPutRequest(context: PutPingPutRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = context.payload?.marshal();

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, putPingPutRequest),
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

export interface DeletePingDeleteRequestContext extends HttpClientContext {
  requestHeaders?: { marshal: () => string };
}

async function deletePingDeleteRequest(context: DeletePingDeleteRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, deletePingDeleteRequest),
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
  payload: Ping;
  requestHeaders?: { marshal: () => string };
}

async function patchPingPatchRequest(context: PatchPingPatchRequestContext): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = context.payload?.marshal();

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, patchPingPatchRequest),
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

export interface HeadPingHeadRequestContext extends HttpClientContext {
  requestHeaders?: { marshal: () => string };
}

async function headPingHeadRequest(context: HeadPingHeadRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, headPingHeadRequest),
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

export interface OptionsPingOptionsRequestContext extends HttpClientContext {
  requestHeaders?: { marshal: () => string };
}

async function optionsPingOptionsRequest(context: OptionsPingOptionsRequestContext = {}): Promise<HttpClientResponse<Pong>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = Pong.unmarshal(rawData);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<Pong> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, optionsPingOptionsRequest),
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

export interface GetMultiStatusResponseContext extends HttpClientContext {
  requestHeaders?: { marshal: () => string };
}

async function getMultiStatusResponse(context: GetMultiStatusResponseContext = {}): Promise<HttpClientResponse<MultiStatusResponseReplyPayloadModule.MultiStatusResponseReplyPayload>> {
  // Apply defaults
  const config = {
    path: '/ping',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = `${config.server}${config.path}`;
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(rawData, response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<MultiStatusResponseReplyPayloadModule.MultiStatusResponseReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, getMultiStatusResponse),
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
  parameters: { getChannelWithParameters: (path: string) => string };
  requestHeaders?: { marshal: () => string };
}

async function getGetUserItem(context: GetGetUserItemContext): Promise<HttpClientResponse<GetUserItemReplyPayloadModule.GetUserItemReplyPayload>> {
  // Apply defaults
  const config = {
    path: '/users/{userId}/items/{itemId}',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = buildUrlWithParameters(config.server, '/users/{userId}/items/{itemId}', context.parameters);
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = GetUserItemReplyPayloadModule.unmarshalByStatusCode(rawData, response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<GetUserItemReplyPayloadModule.GetUserItemReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, getGetUserItem),
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
  payload: ItemRequest;
  parameters: { getChannelWithParameters: (path: string) => string };
  requestHeaders?: { marshal: () => string };
}

async function putUpdateUserItem(context: PutUpdateUserItemContext): Promise<HttpClientResponse<UpdateUserItemReplyPayloadModule.UpdateUserItemReplyPayload>> {
  // Apply defaults
  const config = {
    path: '/users/{userId}/items/{itemId}',
    server: 'localhost:3000',
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2') {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;

  // Build URL
  let url = buildUrlWithParameters(config.server, '/users/{userId}/items/{itemId}', context.parameters);
  url = applyQueryParams(config.queryParams, url);

  // Apply pagination (can affect URL and/or headers)
  const paginationResult = applyPagination(config.pagination, url, headers);
  url = paginationResult.url;
  headers = paginationResult.headers;

  // Apply authentication
  const authResult = applyAuth(config.auth, headers, url);
  headers = authResult.headers;
  url = authResult.url;

  // Prepare body
  const body = context.payload?.marshal();

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
    if (config.auth?.type === 'oauth2' && !config.auth.accessToken) {
      const tokenFlowResponse = await handleOAuth2TokenFlow(config.auth, requestParams, makeRequest, config.retry);
      if (tokenFlowResponse) {
        response = tokenFlowResponse;
      }
    }

    // Handle 401 with token refresh
    if (response.status === 401 && config.auth?.type === 'oauth2') {
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    const responseData = UpdateUserItemReplyPayloadModule.unmarshalByStatusCode(rawData, response.status);

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<UpdateUserItemReplyPayloadModule.UpdateUserItemReplyPayload> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, putUpdateUserItem),
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
