import { HttpRenderType } from "../../../../../types";
import { pascalCase } from "../../../utils";
import { ChannelFunctionTypes, RenderHttpParameters } from "../../types";

export function renderHttpFetchClient({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  method,
  statusCodes = [],
  servers = [],
  subName = pascalCase(requestTopic),
  functionName = `${method.toLowerCase()}${subName}`,
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
  const statusCodeChecks = statusCodes.filter((value) => value.code < 200 && value.code >= 300).map((value) => {
    return `else if (response.status === ${value.code}) {
  return Promise.reject(new FetchError(new Error(response.statusText), response.status, '${value.description}'));
}`;
  });
  const code = `async ${functionName}(context: {
    server?: ${[...servers.map((value) => `'${value}'`), 'string'].join(' | ')};
    ${messageType ?? `payload: ${messageType};`}
    path?: string;
    accessToken?: string;
    username?: string;
    password?: string;
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<${replyType}> {
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
      server: ${servers[0] ?? 'localhost:3000'},
    },
    ...context,
  }
  const headers = {
      'Content-Type': 'application/json',
      ...parsedContext.additionalHeaders
  };
  const url = \`\${parsedContext.server}\${parsedContext.path}\`;

  let body: any;
  ${messageType ?? `if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }`}
  
  if (parsedContext.accessToken) {
    // oauth required
    headers["Authorization"] = parsedContext.accessToken;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(\`\${parsedContext.username}:\${parsedContext.password}\`).toString('base64');
    headers["Authorization"] = \`Basic \${credentials}\`;
  }

  const response = await parsedContext.makeRequestCallback({url,
    method: '${method}',
    headers,
    body
  });	
  if (response.ok) {
    const data = await response.json();
    return ${replyType}.unmarshal(data);
  } ${statusCodeChecks.join('\n  ')}
  return Promise.reject(new Error(response.statusText));
}`;
  return {
    messageType,
    replyType,
    code,
    functionName,
    dependencies: [`import { URLSearchParams } from 'url';`, `import * as NodeFetch from 'node-fetch';`],
    functionType: ChannelFunctionTypes.HTTP_CLIENT
  };
}
