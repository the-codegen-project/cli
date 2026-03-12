/**
 * Security type generation for HTTP client.
 * Analyzes OpenAPI security schemes and generates TypeScript auth interfaces.
 */
import {SecuritySchemeOptions} from '../../types';

/**
 * Escapes special characters in strings that will be interpolated into generated code.
 * Prevents syntax errors when OpenAPI spec values contain quotes, backticks, or template expressions.
 */
export function escapeStringForCodeGen(value: string | undefined): string {
  if (!value) {
    return '';
  }
  return value
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/`/g, '\\`') // Escape backticks
    .replace(/\$/g, '\\$') // Escape dollar signs (prevents ${} template evaluation)
    .replace(/\*\//g, '*\\/'); // Escape */ to prevent JSDoc comment injection
}

/**
 * Determines which auth types are needed based on security schemes.
 */
export interface AuthTypeRequirements {
  bearer: boolean;
  basic: boolean;
  apiKey: boolean;
  oauth2: boolean;
  apiKeySchemes: SecuritySchemeOptions[];
  oauth2Schemes: SecuritySchemeOptions[];
}

/**
 * Analyzes security schemes to determine which auth types are needed.
 */
export function analyzeSecuritySchemes(
  schemes: SecuritySchemeOptions[] | undefined
): AuthTypeRequirements {
  // undefined or empty array = backward compatibility mode, generate all types
  // This allows users to manually configure auth even if no schemes are defined
  if (!schemes || schemes.length === 0) {
    return {
      bearer: true,
      basic: true,
      apiKey: true,
      oauth2: true,
      apiKeySchemes: [],
      oauth2Schemes: []
    };
  }

  const requirements: AuthTypeRequirements = {
    bearer: false,
    basic: false,
    apiKey: false,
    oauth2: false,
    apiKeySchemes: [],
    oauth2Schemes: []
  };

  for (const scheme of schemes) {
    switch (scheme.type) {
      case 'apiKey':
        requirements.apiKey = true;
        requirements.apiKeySchemes.push(scheme);
        break;
      case 'http':
        if (scheme.httpScheme === 'bearer') {
          requirements.bearer = true;
        } else if (scheme.httpScheme === 'basic') {
          requirements.basic = true;
        }
        break;
      case 'oauth2':
      case 'openIdConnect':
        requirements.oauth2 = true;
        requirements.oauth2Schemes.push(scheme);
        break;
    }
  }

  return requirements;
}

/**
 * Generates the BearerAuth interface.
 */
function renderBearerAuthInterface(): string {
  return `/**
 * Bearer token authentication configuration
 */
export interface BearerAuth {
  type: 'bearer';
  token: string;
}`;
}

/**
 * Generates the BasicAuth interface.
 */
function renderBasicAuthInterface(): string {
  return `/**
 * Basic authentication configuration (username/password)
 */
export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}`;
}

/**
 * Extracts API key defaults from schemes.
 * If there's exactly one apiKey scheme, use its values; otherwise use standard defaults.
 */
export function getApiKeyDefaults(apiKeySchemes: SecuritySchemeOptions[]): {
  name: string;
  in: string;
} {
  if (apiKeySchemes.length === 1) {
    return {
      name: apiKeySchemes[0].apiKeyName || 'X-API-Key',
      in: apiKeySchemes[0].apiKeyIn || 'header'
    };
  }
  return {
    name: 'X-API-Key',
    in: 'header'
  };
}

/**
 * Generates the ApiKeyAuth interface with optional pre-populated defaults from spec.
 */
function renderApiKeyAuthInterface(
  apiKeySchemes: SecuritySchemeOptions[]
): string {
  const defaults = getApiKeyDefaults(apiKeySchemes);

  // For cookie support
  const inType = apiKeySchemes.some((s) => s.apiKeyIn === 'cookie')
    ? "'header' | 'query' | 'cookie'"
    : "'header' | 'query'";

  // Escape spec values for safe interpolation into generated code
  const escapedDefaultName = escapeStringForCodeGen(defaults.name);
  const escapedDefaultIn = escapeStringForCodeGen(defaults.in);

  return `/**
 * API key authentication configuration
 */
export interface ApiKeyAuth {
  type: 'apiKey';
  key: string;
  name?: string;        // Name of the API key parameter (default: '${escapedDefaultName}')
  in?: ${inType}; // Where to place the API key (default: '${escapedDefaultIn}')
}`;
}

/**
 * Extracts the tokenUrl from OAuth2 flows.
 */
function extractTokenUrl(
  flows: NonNullable<SecuritySchemeOptions['oauth2Flows']>
): string | undefined {
  return (
    flows.clientCredentials?.tokenUrl ||
    flows.password?.tokenUrl ||
    flows.authorizationCode?.tokenUrl
  );
}

/**
 * Extracts the authorizationUrl from OAuth2 flows.
 */
function extractAuthorizationUrl(
  flows: NonNullable<SecuritySchemeOptions['oauth2Flows']>
): string | undefined {
  return (
    flows.implicit?.authorizationUrl ||
    flows.authorizationCode?.authorizationUrl
  );
}

/**
 * Collects all scopes from OAuth2 flows.
 */
function collectScopes(
  flows: NonNullable<SecuritySchemeOptions['oauth2Flows']>
): Set<string> {
  const allScopes = new Set<string>();
  const flowTypes = [
    flows.implicit,
    flows.password,
    flows.clientCredentials,
    flows.authorizationCode
  ];

  for (const flow of flowTypes) {
    if (flow?.scopes) {
      Object.keys(flow.scopes).forEach((s) => allScopes.add(s));
    }
  }

  return allScopes;
}

interface OAuth2DocComments {
  tokenUrlComment: string;
  authorizationUrlComment: string;
  scopesComment: string;
}

/**
 * Formats scopes into a documentation comment.
 */
function formatScopesComment(scopes: Set<string>): string {
  if (scopes.size === 0) {
    return '';
  }
  const scopeList = Array.from(scopes)
    .slice(0, 3)
    .map((scope) => escapeStringForCodeGen(scope))
    .join(', ');
  const suffix = scopes.size > 3 ? '...' : '';
  return ` Available: ${scopeList}${suffix}`;
}

/**
 * Extracts documentation comments from a single OAuth2 scheme.
 */
function extractSchemeComments(
  scheme: SecuritySchemeOptions,
  existing: OAuth2DocComments
): OAuth2DocComments {
  if (scheme.openIdConnectUrl) {
    return {
      ...existing,
      tokenUrlComment: `OpenID Connect URL: '${escapeStringForCodeGen(scheme.openIdConnectUrl)}'`
    };
  }

  if (!scheme.oauth2Flows) {
    return existing;
  }

  const tokenUrl = extractTokenUrl(scheme.oauth2Flows);
  const authUrl = extractAuthorizationUrl(scheme.oauth2Flows);
  const allScopes = collectScopes(scheme.oauth2Flows);

  return {
    tokenUrlComment: tokenUrl
      ? `default: '${escapeStringForCodeGen(tokenUrl)}'`
      : existing.tokenUrlComment,
    authorizationUrlComment: authUrl
      ? ` Authorization URL: '${escapeStringForCodeGen(authUrl)}'`
      : existing.authorizationUrlComment,
    scopesComment: formatScopesComment(allScopes) || existing.scopesComment
  };
}

/**
 * Extracts documentation comments from OAuth2 schemes.
 */
function extractOAuth2DocComments(
  oauth2Schemes: SecuritySchemeOptions[]
): OAuth2DocComments {
  const initial: OAuth2DocComments = {
    tokenUrlComment:
      'required for client_credentials/password flows and token refresh',
    authorizationUrlComment: '',
    scopesComment: ''
  };

  return oauth2Schemes.reduce(
    (acc, scheme) => extractSchemeComments(scheme, acc),
    initial
  );
}

/**
 * Generates the OAuth2Auth interface with optional pre-populated values from spec.
 */
function renderOAuth2AuthInterface(
  oauth2Schemes: SecuritySchemeOptions[]
): string {
  const {tokenUrlComment, authorizationUrlComment, scopesComment} =
    extractOAuth2DocComments(oauth2Schemes);

  const flowsInfo = authorizationUrlComment
    ? `\n *${authorizationUrlComment}`
    : '';

  return `/**
 * OAuth2 authentication configuration
 *
 * Supports server-side flows only:
 * - client_credentials: Server-to-server authentication
 * - password: Resource owner password credentials (legacy, not recommended)
 * - Pre-obtained accessToken: For tokens obtained via browser-based flows
 *
 * For browser-based flows (implicit, authorization_code), obtain the token
 * separately and pass it as accessToken.${flowsInfo}
 */
export interface OAuth2Auth {
  type: 'oauth2';
  /** Pre-obtained access token (required if not using a server-side flow) */
  accessToken?: string;
  /** Refresh token for automatic token renewal on 401 */
  refreshToken?: string;
  /** Token endpoint URL (${tokenUrlComment}) */
  tokenUrl?: string;
  /** Client ID (required for flows and token refresh) */
  clientId?: string;
  /** Client secret (optional, depends on OAuth provider) */
  clientSecret?: string;
  /** Requested scopes${scopesComment} */
  scopes?: string[];
  /** Server-side flow type */
  flow?: 'password' | 'client_credentials';
  /** Username for password flow */
  username?: string;
  /** Password for password flow */
  password?: string;
  /** Callback when tokens are refreshed (for caching/persistence) */
  onTokenRefresh?: (newTokens: TokenResponse) => void;
}`;
}

/**
 * Generates the AuthConfig union type based on which auth types are needed.
 */
function renderAuthConfigType(requirements: AuthTypeRequirements): string {
  const types: string[] = [];

  if (requirements.bearer) {
    types.push('BearerAuth');
  }
  if (requirements.basic) {
    types.push('BasicAuth');
  }
  if (requirements.apiKey) {
    types.push('ApiKeyAuth');
  }
  if (requirements.oauth2) {
    types.push('OAuth2Auth');
  }

  // If no types are needed (e.g., no recognized security schemes), don't generate AuthConfig
  // The auth field in HttpClientContext is optional, so this is safe
  if (types.length === 0) {
    return '// No authentication types needed for this API\nexport type AuthConfig = never;';
  }

  return `/**
 * Union type for all authentication methods - provides autocomplete support
 */
export type AuthConfig = ${types.join(' | ')};`;
}

/**
 * Generates the security configuration types based on extracted security schemes.
 */
export function renderSecurityTypes(
  schemes: SecuritySchemeOptions[] | undefined,
  requirements?: AuthTypeRequirements
): string {
  const authRequirements = requirements ?? analyzeSecuritySchemes(schemes);

  const bearerSection = authRequirements.bearer
    ? `${renderBearerAuthInterface()}\n\n`
    : '';

  const basicSection = authRequirements.basic
    ? `${renderBasicAuthInterface()}\n\n`
    : '';

  const apiKeySection = authRequirements.apiKey
    ? `${renderApiKeyAuthInterface(authRequirements.apiKeySchemes)}\n\n`
    : '';

  const oauth2Section = authRequirements.oauth2
    ? `${renderOAuth2AuthInterface(authRequirements.oauth2Schemes)}\n\n`
    : '';

  return `// ============================================================================
// Security Configuration Types - Grouped for better autocomplete
// ============================================================================

${bearerSection}${basicSection}${apiKeySection}${oauth2Section}${renderAuthConfigType(authRequirements)}`;
}

/**
 * Generate OAuth2 stub functions when OAuth2 is not available.
 * These stubs ensure TypeScript compilation succeeds when generated code
 * references OAuth2 functions, but the runtime guards prevent them from being called.
 */
export function renderOAuth2Stubs(): string {
  return `
// OAuth2 helpers not needed for this API - provide type-safe stubs
// These are never called due to AUTH_FEATURES.oauth2 runtime guards
type OAuth2Auth = never;
function validateOAuth2Config(_auth: OAuth2Auth): void {}
async function handleOAuth2TokenFlow(
  _auth: OAuth2Auth,
  _originalParams: HttpRequestParams,
  _makeRequest: (params: HttpRequestParams) => Promise<HttpResponse>,
  _retryConfig?: RetryConfig
): Promise<HttpResponse | null> { return null; }
async function handleTokenRefresh(
  _auth: OAuth2Auth,
  _originalParams: HttpRequestParams,
  _makeRequest: (params: HttpRequestParams) => Promise<HttpResponse>,
  _retryConfig?: RetryConfig
): Promise<HttpResponse | null> { return null; }`;
}

/**
 * Generates OAuth2-specific helper functions.
 * Only included when OAuth2 auth is needed.
 */
export function renderOAuth2Helpers(): string {
  return `
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
    const credentials = Buffer.from(\`\${auth.clientId}:\${auth.clientSecret}\`).toString('base64');
    authHeaders['Authorization'] = \`Basic \${credentials}\`;
    params.delete('client_id');
    params.delete('client_secret');
  }

  const tokenResponse = await NodeFetch.default(auth.tokenUrl, {
    method: 'POST',
    headers: authHeaders,
    body: params.toString()
  });

  if (!tokenResponse.ok) {
    throw new Error(\`OAuth2 token request failed: \${tokenResponse.statusText}\`);
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
  updatedHeaders['Authorization'] = \`Bearer \${tokens.accessToken}\`;

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
  updatedHeaders['Authorization'] = \`Bearer \${newTokens.accessToken}\`;

  return executeWithRetry({ ...originalParams, headers: updatedHeaders }, makeRequest, retryConfig);
}`;
}
