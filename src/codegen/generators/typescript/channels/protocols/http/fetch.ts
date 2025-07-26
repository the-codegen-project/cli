import {HttpRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ChannelFunctionTypes, RenderHttpParameters} from '../../types';

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
  functionName = `${method.toLowerCase()}${subName}`
}: RenderHttpParameters): HttpRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;
  const messageType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;
  const replyType = replyMessageModule
    ? `${replyMessageModule}.${replyMessageType}`
    : replyMessageType;
  const functionReturnType = `{error?: string, statusCode: number, payload?: ${replyType}, rawResponse?: any, rawData?: any}`;
  const code = `async ${functionName}(context: {
    server?: ${[...servers.map((value) => `'${value}'`), 'string'].join(' | ')};
    ${messageType ? `payload: ${messageType};` : ''}
    path?: string;
    headers?: Record<string, string | string[]>; // header params we want to use on every request
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<${functionReturnType}> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: ${addressToUse},
      server: '${servers[0] ?? "localhost:3000"}',
    },
    ...context,
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.headers
  };
  
  const url = \`\${parsedContext.server}\${parsedContext.path}\`;

  let body: any;
  ${
    messageType
      ? `if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }`
      : ''
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({
    url,
    method: '${method}',
    headers,
    body
  });	
  
  ${
    replyMessageModule
      ? `// For multi-status responses, always try to parse JSON and let unmarshalByStatusCode handle it
  try {
    const data = await response.json();
    return {...${replyMessageModule}.unmarshalByStatusCode(data, response.status), rawData: data, rawResponse: response, statusCode: response.status};
  } catch (error) {
    return {error: \`Error parsing JSON response: \${error}\`, statusCode: response.status, rawResponse: response};
  }`
      : `// Handle error status codes before attempting to parse JSON (only for single-status responses)
  if (!response.ok) {
    return {error: \`HTTP Error: \${response.status} \${response.statusText}\`, statusCode: response.status, rawResponse: response};
  }
  
  const data = await response.json();
  return {payload: ${replyMessageType}.unmarshal(data), rawData: data, rawResponse: response, statusCode: response.status};`
  }
}`;
  return {
    messageType,
    replyType,
    code,
    functionName,
    dependencies: [
      `import * as NodeFetch from 'node-fetch';`
    ],
    functionType: ChannelFunctionTypes.HTTP_CLIENT
  };
}
