/**
 * Generates HTTP client functions for individual API operations.
 * Each operation gets a typed function with request/response handling.
 */
import {HttpRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ChannelFunctionTypes, RenderHttpParameters} from '../../types';
import {renderChannelJSDoc} from '../../utils';

/**
 * Renders an HTTP fetch client function for a specific API operation.
 */
export function renderHttpFetchClient({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  method,
  servers = [],
  subName = pascalCase(requestTopic),
  functionName = `${method.toLowerCase()}${subName}`,
  includesStatusCodes = false,
  description,
  deprecated
}: RenderHttpParameters): HttpRenderType {
  const messageType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;
  const replyType = replyMessageModule
    ? `${replyMessageModule}.${replyMessageType}`
    : replyMessageType;

  // Generate context interface name
  const contextInterfaceName = `${pascalCase(functionName)}Context`;

  // Determine if operation has path parameters
  const hasParameters = channelParameters !== undefined;

  // Generate the context interface (extends HttpClientContext)
  const contextInterface = generateContextInterface(
    contextInterfaceName,
    messageType,
    hasParameters,
    method
  );

  // Generate JSDoc for the function
  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `HTTP ${method} request to ${requestTopic}`
  });

  // Generate the function implementation
  const functionCode = generateFunctionImplementation({
    functionName,
    contextInterfaceName,
    replyType,
    replyMessageModule,
    replyMessageType,
    messageType,
    requestTopic,
    hasParameters,
    method,
    servers,
    includesStatusCodes,
    jsDoc
  });

  const code = `${contextInterface}

${functionCode}`;

  return {
    messageType,
    replyType,
    code,
    functionName,
    dependencies: [
      `import { URLSearchParams, URL } from 'url';`,
      `import * as NodeFetch from 'node-fetch';`
    ],
    functionType: ChannelFunctionTypes.HTTP_CLIENT
  };
}

/**
 * Generate the context interface for an HTTP operation
 */
function generateContextInterface(
  interfaceName: string,
  messageType: string | undefined,
  hasParameters: boolean,
  method: string
): string {
  const fields: string[] = [];

  // Add payload field for methods that have a body
  if (messageType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    fields.push(`  payload: ${messageType};`);
  }

  // Add parameters field if operation has path parameters
  if (hasParameters) {
    fields.push(
      `  parameters: { getChannelWithParameters: (path: string) => string };`
    );
  }

  // Add requestHeaders field (optional) for operations that support typed headers
  // This is always optional since headers can also be passed via additionalHeaders
  fields.push(`  requestHeaders?: { marshal: () => string };`);

  const fieldsStr = fields.length > 0 ? `\n${fields.join('\n')}\n` : '';

  return `export interface ${interfaceName} extends HttpClientContext {${fieldsStr}}`;
}

/**
 * Generate the function implementation
 */
function generateFunctionImplementation(params: {
  functionName: string;
  contextInterfaceName: string;
  replyType: string;
  replyMessageModule: string | undefined;
  replyMessageType: string;
  messageType: string | undefined;
  requestTopic: string;
  hasParameters: boolean;
  method: string;
  servers: string[];
  includesStatusCodes: boolean;
  jsDoc: string;
}): string {
  const {
    functionName,
    contextInterfaceName,
    replyType,
    replyMessageModule,
    replyMessageType,
    messageType,
    requestTopic,
    hasParameters,
    method,
    servers,
    includesStatusCodes,
    jsDoc
  } = params;

  const defaultServer = servers[0] ?? "'localhost:3000'";
  const hasBody =
    messageType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());

  // Generate URL building code
  const urlBuildCode = hasParameters
    ? `let url = buildUrlWithParameters(config.server, '${requestTopic}', context.parameters);`
    : 'let url = `${config.server}${config.path}`;';

  // Generate headers initialization
  const headersInit = `let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;`;

  // Generate body preparation
  const bodyPrep = hasBody
    ? `const body = context.payload?.marshal();`
    : `const body = undefined;`;

  // Generate response parsing
  // Use unmarshalByStatusCode if the payload is a union type with status code support
  let responseParseCode: string;
  if (replyMessageModule) {
    responseParseCode = includesStatusCodes
      ? `const responseData = ${replyMessageModule}.unmarshalByStatusCode(rawData, response.status);`
      : `const responseData = ${replyMessageModule}.unmarshal(rawData);`;
  } else {
    responseParseCode = `const responseData = ${replyMessageType}.unmarshal(rawData);`;
  }

  // Generate default context for optional context parameter
  const contextDefault = !hasBody && !hasParameters ? ' = {}' : '';

  return `${jsDoc}
async function ${functionName}(context: ${contextInterfaceName}${contextDefault}): Promise<HttpClientResponse<${replyType}>> {
  // Apply defaults
  const config = {
    path: '${requestTopic}',
    server: ${defaultServer},
    ...context,
  };

  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

  // Build headers
  ${headersInit}

  // Build URL
  ${urlBuildCode}
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
  ${bodyPrep}

  // Determine request function
  const makeRequest = config.hooks?.makeRequest ?? defaultMakeRequest;

  // Build request params
  let requestParams: HttpRequestParams = {
    url,
    method: '${method}',
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
      handleHttpError(response.status, response.statusText);
    }

    // Parse response
    const rawData = await response.json();
    ${responseParseCode}

    // Extract response metadata
    const responseHeaders = extractHeaders(response);
    const paginationInfo = extractPaginationInfo(responseHeaders, config.pagination);

    // Build response wrapper with pagination helpers
    const result: HttpClientResponse<${replyType}> = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      rawData,
      pagination: paginationInfo,
      ...createPaginationHelpers(config, paginationInfo, ${functionName}),
    };

    return result;

  } catch (error) {
    // Apply onError hook if present
    if (config.hooks?.onError && error instanceof Error) {
      throw await config.hooks.onError(error, requestParams);
    }
    throw error;
  }
}`;
}
