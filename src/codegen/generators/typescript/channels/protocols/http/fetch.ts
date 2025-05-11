import { SingleFunctionRenderType } from "../../../../../types";
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
  subName = pascalCase(requestTopic),
  functionName = `${method.toLowerCase()}${subName}`,
}: RenderHttpParameters): SingleFunctionRenderType {
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
  const code = `async ${functionName}(context: RequestContext<${messageType}>): Promise<${replyType}> {
  const parsedContext: InternalRequestContext<${messageType}> = {
    ...{
      fetch: async (url, options) => {
        return NodeFetch.default(url, {
          body: options.body,
          method: options.method,
          headers: options.headers
        })
      },
      basePath: ${addressToUse},
    },
    ...context,
  }
  const headers: HTTPHeaders = {
      'Content-Type': 'application/json',
      ...parsedContext.additionalHeaders
  };
  const url = parsedContext.server ?? parsedContext.basePath;

  let body: any;
  if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }
  if (parsedContext.accessToken) {
    // oauth required
    headers["Authorization"] = parsedContext.accessToken;
  }

  const response = await parsedContext.fetch(url, {
    method: '${method}',
    headers,
    body,
    credentials: parsedContext.credentials,
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
