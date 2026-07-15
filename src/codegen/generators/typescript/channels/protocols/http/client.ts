/**
 * Generates HTTP client functions for individual API operations.
 * Each operation gets a typed function with request/response handling.
 */
import {HttpRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ChannelFunctionTypes, RenderHttpParameters} from '../../types';
import {
  parameterUnionType,
  renderParameterNormalization,
  renderChannelJSDoc
} from '../../utils';

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
  hasSerializeHeaders = false
}: RenderHttpParameters): HttpRenderType {
  const messageType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;
  const replyType = replyMessageModule
    ? `${replyMessageModule}.${replyMessageType}`
    : replyMessageType;

  // Generate context interface name
  const contextInterfaceName = `${pascalCase(functionName)}Context`;

  // Determine if operation has path parameters or headers
  const hasParameters = channelParameters !== undefined;
  const hasHeaders = channelHeaders !== undefined;

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
    parameterModelName: channelParameters?.name,
    hasHeaders,
    headersType: channelHeaders?.type,
    hasSerializeHeaders,
    method,
    servers,
    includesStatusCodes,
    jsDoc,
    oauth2Enabled
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

  // Add parameters field if the operation has path parameters. The field
  // accepts either a plain object satisfying the parameter interface
  // (ergonomic) or a concrete parameter class instance (rich behavior); the
  // function body normalizes it to an instance before use — the normalized
  // instance still exposes getChannelWithParameters for buildUrlWithParameters.
  if (parametersType) {
    fields.push(`  parameters: ${parameterUnionType(parametersType)};`);
  }

  // Emit requestHeaders only when the spec defines operation headers so the
  // context stays minimal for operations that don't have them.
  if (headersType) {
    fields.push(`  requestHeaders?: ${headersType};`);
  }

  const fieldsStr = fields.length > 0 ? `\n${fields.join('\n')}\n` : '';

  return `export interface ${interfaceName} extends HttpClientContext {${fieldsStr}}`;
}

/**
 * Generate the `let headers = ...` initializer. Operations without spec-defined
 * headers get a plain default; operations with headers either serialize a typed
 * header model or merge the raw typed headers via applyTypedHeaders.
 */
function generateHeadersInit(params: {
  hasHeaders: boolean;
  headersType: string | undefined;
  hasSerializeHeaders: boolean;
}): string {
  const {hasHeaders, headersType, hasSerializeHeaders} = params;

  if (!hasHeaders) {
    return `let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;`;
  }
  if (hasSerializeHeaders) {
    return `let headers = { 'Content-Type': 'application/json', ...config.additionalHeaders, ...(context.requestHeaders ? serialize${headersType}Headers(context.requestHeaders) : {}) } as Record<string, string | string[]>;`;
  }
  return `let headers = context.requestHeaders
    ? applyTypedHeaders(context.requestHeaders, config.additionalHeaders)
    : { 'Content-Type': 'application/json', ...config.additionalHeaders } as Record<string, string | string[]>;`;
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
  parameterModelName: string | undefined;
  hasHeaders: boolean;
  headersType: string | undefined;
  hasSerializeHeaders: boolean;
  method: string;
  servers: string[];
  includesStatusCodes: boolean;
  jsDoc: string;
  oauth2Enabled: boolean;
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
    parameterModelName,
    hasHeaders,
    headersType,
    hasSerializeHeaders,
    method,
    servers,
    includesStatusCodes,
    jsDoc,
    oauth2Enabled
  } = params;

  const defaultServer = servers[0] ?? "'http://localhost:3000'";
  const hasBody =
    messageType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());

  // Normalize the user-provided parameters (interface object or class instance)
  // to a concrete class instance so the URL builder gets the rich behavior.
  const parameterNormalization =
    hasParameters && parameterModelName
      ? `  ${renderParameterNormalization({
          modelName: parameterModelName,
          source: 'context.parameters',
          target: 'parameters'
        })}\n\n`
      : '';

  // Generate URL building code
  const urlBuildCode = hasParameters
    ? `let url = buildUrlWithParameters(config.baseUrl, '${requestTopic}', parameters);`
    : `let url = \`\${config.baseUrl}${requestTopic}\`;`;

  // Generate headers initialization
  const headersInit = generateHeadersInit({
    hasHeaders,
    headersType,
    hasSerializeHeaders
  });

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
    baseUrl: ${defaultServer},
    ...context,
  };

${parameterNormalization}${oauth2ValidateBlock}  // Build headers
  ${headersInit}

  // Build URL
  ${urlBuildCode}
  url = applyQueryParams(config.additionalQueryParams, url);

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

    const result: HttpClientResponse<${replyType}> = {
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
}`;
}
