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
  channelHeaders,
  method,
  servers = [],
  subName = pascalCase(requestTopic),
  functionName = `${method.toLowerCase()}${subName}`,
  includesStatusCodes = false,
  description,
  deprecated,
  oauth2Enabled = true,
  hasSerializeUrl = false
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
    channelParameters?.type,
    channelHeaders?.type,
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
    parametersType: channelParameters?.type,
    method,
    servers,
    includesStatusCodes,
    jsDoc,
    oauth2Enabled,
    hasSerializeUrl
  });

  const code = `${contextInterface}

${functionCode}`;

  return {
    messageType,
    replyType,
    code,
    functionName,
    dependencies: [],
    functionType: ChannelFunctionTypes.HTTP_CLIENT,
    parameterType: channelParameters?.name
  };
}

/**
 * Generate the context interface for an HTTP operation
 */
function generateContextInterface(
  interfaceName: string,
  messageType: string | undefined,
  parametersType: string | undefined,
  headersType: string | undefined,
  method: string
): string {
  const fields: string[] = [];

  // Add payload field for methods that have a body
  if (messageType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    fields.push(`  payload: ${messageType};`);
  }

  // Reference the concrete generated parameter interface so consumers get typed
  // query/path parameters. The serialize function is called by buildUrlWithParameters.
  if (parametersType) {
    fields.push(`  parameters: ${parametersType};`);
  }

  // Reference the concrete generated headers model when available; fall back to
  // the structural marshal contract otherwise. Always optional since headers can
  // also be passed via additionalHeaders.
  fields.push(
    `  requestHeaders?: ${headersType ?? '{ marshal: () => string }'};`
  );

  const fieldsStr = fields.length > 0 ? `\n${fields.join('\n')}\n` : '';

  return `export interface ${interfaceName} extends HttpClientContext {${fieldsStr}}`;
}

function buildUrlCode(
  requestTopic: string,
  hasParameters: boolean,
  parametersType: string | undefined,
  hasSerializeUrl: boolean
): string {
  if (!hasParameters || !parametersType) {
    return 'let url = `${config.server}${config.path}`;';
  }
  const serializeFn = hasSerializeUrl
    ? `serialize${parametersType}Url(context.parameters, path)`
    : `context.parameters.getChannelWithParameters(path)`;
  return `let url = buildUrlWithParameters(config.server, '${requestTopic}', (path) => ${serializeFn});`;
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
  parametersType: string | undefined;
  method: string;
  servers: string[];
  includesStatusCodes: boolean;
  jsDoc: string;
  oauth2Enabled: boolean;
  hasSerializeUrl: boolean;
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
    parametersType,
    method,
    servers,
    includesStatusCodes,
    jsDoc,
    oauth2Enabled,
    hasSerializeUrl
  } = params;

  const defaultServer = servers[0] ?? "'localhost:3000'";
  const hasBody =
    messageType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());

  const urlBuildCode = buildUrlCode(requestTopic, hasParameters, parametersType, hasSerializeUrl);

  // Generate headers initialization
  const headersInit = `let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;`;

  // Generate body preparation
  const bodyPrep = hasBody
    ? `const body = context.payload?.marshal();`
    : `const body = undefined;`;

  // Generate response parsing.
  // Use unmarshalByStatusCode if the payload is a union type with status code support.
  // unmarshal receives the raw JSON text (JSON.stringify(rawData)) rather than the
  // parsed object: object/array models accept either, but primitive-typed payloads
  // (e.g. `type X = string`) generate `unmarshal(json: string)` which JSON.parses its
  // argument, so passing the already-parsed value would both fail to type-check and
  // throw at runtime.
  let responseParseCode: string;
  if (replyMessageModule) {
    responseParseCode = includesStatusCodes
      ? `const responseData = ${replyMessageModule}.unmarshalByStatusCode(JSON.stringify(rawData), response.status);`
      : `const responseData = ${replyMessageModule}.unmarshal(JSON.stringify(rawData));`;
  } else {
    responseParseCode = `const responseData = ${replyMessageType}.unmarshal(JSON.stringify(rawData));`;
  }

  // Generate default context for optional context parameter
  const contextDefault = !hasBody && !hasParameters ? ' = {}' : '';

  // OAuth2 request handling is only emitted when the API actually defines an
  // OAuth2 scheme; otherwise these branches reference fields/functions that the
  // narrowed AuthConfig union no longer carries and would fail to type-check.
  const oauth2ValidateBlock = oauth2Enabled
    ? `  // Validate OAuth2 config if present
  if (config.auth?.type === 'oauth2' && AUTH_FEATURES.oauth2) {
    validateOAuth2Config(config.auth);
  }

`
    : '';

  const oauth2TokenBlock = oauth2Enabled
    ? `
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
`
    : '';

  return `${jsDoc}
async function ${functionName}(context: ${contextInterfaceName}${contextDefault}): Promise<HttpClientResponse<${replyType}>> {
  // Apply defaults
  const config = {
    path: '${requestTopic}',
    server: ${defaultServer},
    ...context,
  };

${oauth2ValidateBlock}  // Build headers
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
${oauth2TokenBlock}
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
