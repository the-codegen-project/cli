/**
 * Generates common types and helper functions shared across all HTTP client functions.
 * This module renders the shared infrastructure code that is included once per generation.
 */
import {SecuritySchemeOptions} from '../../types';
import {
  analyzeSecuritySchemes,
  escapeStringForCodeGen,
  getApiKeyDefaults,
  renderApplyAuthCases,
  renderOAuth2Helpers,
  renderSecurityTypes
} from './security';

/**
 * Generates common types and helper functions shared across all HTTP client functions.
 * This should be called once per protocol generation to avoid code duplication.
 *
 * @param securitySchemes - Optional security schemes extracted from OpenAPI.
 *                          When provided, only relevant auth types are generated.
 *                          When undefined/empty, all auth types are generated for backward compatibility.
 */
export function renderHttpCommonTypes(
  securitySchemes?: SecuritySchemeOptions[]
): string {
  const requirements = analyzeSecuritySchemes(securitySchemes);
  const securityTypes = renderSecurityTypes(securitySchemes, requirements);
  const applyAuthCases = renderApplyAuthCases(requirements);

  // Only emit the AUTH_FEATURES flag when OAuth2 code is generated, and the
  // API_KEY_DEFAULTS const when an apiKey case is generated - otherwise they
  // become unused declarations in the output.
  const authFeaturesBlock = requirements.oauth2
    ? `
/**
 * Feature flags indicating which auth types are available.
 * Used internally to conditionally call auth-specific helpers.
 */
const AUTH_FEATURES = {
  oauth2: ${requirements.oauth2}
} as const;
`
    : '';

  const apiKeyDefaultsBlock = requirements.apiKey
    ? `
/**
 * Default values for API key authentication derived from the spec.
 * These match the defaults documented in the ApiKeyAuth interface.
 */
const API_KEY_DEFAULTS = {
  name: '${escapeStringForCodeGen(getApiKeyDefaults(requirements.apiKeySchemes).name)}',
  in: '${escapeStringForCodeGen(getApiKeyDefaults(requirements.apiKeySchemes).in)}' as 'header' | 'query' | 'cookie'
} as const;
`
    : '';

  return `// ============================================================================
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

${securityTypes}
${authFeaturesBlock}${apiKeyDefaultsBlock}
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
  server?: string;
  path?: string;

  // Authentication - grouped for better autocomplete
  auth?: AuthConfig;

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
${applyAuthCases}
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
  return \`\${url}\${separator}\${paramString}\`;
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
      lastError = new Error(\`HTTP Error: \${response.status} \${response.statusText}\`);
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
      throw new Error(\`HTTP Error: \${status} \${statusText}\`);
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
 * Builds a URL with path parameters replaced using a serializer function
 * @param server - Base server URL
 * @param pathTemplate - Path template with {param} placeholders
 * @param serializeFn - Function that takes the path template and returns the serialized path
 */
function buildUrlWithParameters(
  server: string,
  pathTemplate: string,
  serializeFn: (path: string) => string
): string {
  const path = serializeFn(pathTemplate);
  return \`\${server}\${path}\`;
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
${requirements.oauth2 ? renderOAuth2Helpers() : ''}
// ============================================================================
// Generated HTTP Client Functions
// ============================================================================`;
}
