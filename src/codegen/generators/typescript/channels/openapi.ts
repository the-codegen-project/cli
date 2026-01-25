/**
 * Generates TypeScript HTTP client functions from OpenAPI specifications.
 * Maps OpenAPI paths and operations to the existing renderHttpFetchClient infrastructure.
 */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {TypeScriptParameterRenderType} from '../parameters';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptHeadersRenderType} from '../headers';
import {
  TypeScriptChannelRenderedFunctionType,
  SupportedProtocols,
  TypeScriptChannelsContext
} from './types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {collectProtocolDependencies} from './utils';
import {resetHttpCommonTypesState} from './protocols/http';
import {
  renderHttpFetchClient,
  renderHttpCommonTypes
} from './protocols/http/fetch';
import {getMessageTypeAndModule} from './utils';
import {pascalCase} from '../utils';

type OpenAPIDocument =
  | OpenAPIV3.Document
  | OpenAPIV2.Document
  | OpenAPIV3_1.Document;
type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'options'
  | 'head';

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head'
];
const METHODS_WITH_BODY: HttpMethod[] = ['post', 'put', 'patch'];

// Track whether common types have been generated
let httpCommonTypesGenerated = false;

/**
 * Generates TypeScript HTTP client channels from an OpenAPI document.
 * Only supports http_client protocol - other protocols are ignored for OpenAPI input.
 */
export async function generateTypeScriptChannelsForOpenAPI(
  context: TypeScriptChannelsContext,
  parameters: TypeScriptParameterRenderType,
  payloads: TypeScriptPayloadRenderType,
  headers: TypeScriptHeadersRenderType,
  protocolsToUse: SupportedProtocols[],
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  protocolDependencies: Record<string, string[]>
): Promise<void> {
  // Only http_client is supported for OpenAPI
  if (!protocolsToUse.includes('http_client')) {
    return;
  }

  // Reset HTTP common types state
  resetHttpCommonTypesState();
  httpCommonTypesGenerated = false;

  const {openapiDocument} = validateOpenAPIContext(context);

  // Collect dependencies
  const deps = protocolDependencies['http_client'];
  collectProtocolDependencies(payloads, parameters, headers, context, deps);

  const renders: ReturnType<typeof renderHttpFetchClient>[] = [];

  // Iterate OpenAPI paths
  for (const [path, pathItem] of Object.entries(openapiDocument.paths ?? {})) {
    if (!pathItem) {continue;}

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | OpenAPIV3.OperationObject
        | OpenAPIV2.OperationObject
        | OpenAPIV3_1.OperationObject
        | undefined;
      if (!operation) {continue;}

      const operationId = getOperationId(operation, method, path);
      const hasBody = METHODS_WITH_BODY.includes(method);

      // Look up payloads
      const requestPayload = hasBody
        ? payloads.operationModels[operationId]
        : undefined;
      const responsePayload =
        payloads.operationModels[`${operationId}_Response`];

      // Look up parameters
      const parameterModel = parameters.channelModels[operationId];

      // Extract status codes from responses
      const statusCodes = extractStatusCodes(operation.responses);

      // Get message types - handle undefined payloads
      const requestMessageInfo = requestPayload
        ? getMessageTypeAndModule(requestPayload)
        : {
            messageModule: undefined,
            messageType: undefined,
            includesStatusCodes: false
          };
      const responseMessageInfo = responsePayload
        ? getMessageTypeAndModule(responsePayload)
        : {
            messageModule: undefined,
            messageType: undefined,
            includesStatusCodes: false
          };

      const {
        messageModule: requestMessageModule,
        messageType: requestMessageType
      } = requestMessageInfo;
      const {
        messageModule: replyMessageModule,
        messageType: replyMessageType,
        includesStatusCodes: replyIncludesStatusCodes
      } = responseMessageInfo;

      // Skip if no response type (nothing to generate)
      if (!replyMessageType) {continue;}

      // Generate the HTTP client function
      const render = renderHttpFetchClient({
        subName: pascalCase(operationId),
        requestMessageModule: hasBody ? requestMessageModule : undefined,
        requestMessageType: hasBody ? requestMessageType : undefined,
        replyMessageModule,
        replyMessageType,
        requestTopic: path,
        method: method.toUpperCase() as
          | 'GET'
          | 'POST'
          | 'PUT'
          | 'PATCH'
          | 'DELETE'
          | 'OPTIONS'
          | 'HEAD',
        statusCodes,
        channelParameters: parameterModel?.model as
          | ConstrainedObjectModel
          | undefined,
        includesStatusCodes: replyIncludesStatusCodes
      });

      renders.push(render);
    }
  }

  // Generate common types once
  if (!httpCommonTypesGenerated && renders.length > 0) {
    const commonTypesCode = renderHttpCommonTypes();
    protocolCodeFunctions['http_client'].unshift(commonTypesCode);
    httpCommonTypesGenerated = true;
  }

  // Add renders to output
  protocolCodeFunctions['http_client'].push(...renders.map((r) => r.code));
  externalProtocolFunctionInformation['http_client'].push(
    ...renders.map((r) => ({
      functionType: r.functionType,
      functionName: r.functionName,
      messageType: r.messageType ?? '',
      replyType: r.replyType,
      parameterType: undefined
    }))
  );

  // Add dependencies
  const renderedDeps = renders.flatMap((r) => r.dependencies);
  deps.push(...new Set(renderedDeps));
}

/**
 * Validates the context is for OpenAPI input and has a parsed document.
 */
function validateOpenAPIContext(context: TypeScriptChannelsContext): {
  openapiDocument: OpenAPIDocument;
} {
  const {openapiDocument, inputType} = context;
  if (inputType !== 'openapi') {
    throw new Error('Expected OpenAPI input, was not given');
  }
  if (!openapiDocument) {
    throw new Error('Expected a parsed OpenAPI document, was not given');
  }
  return {openapiDocument};
}

/**
 * Gets the operation ID from an OpenAPI operation.
 * Falls back to generating one from method+path if not present.
 */
function getOperationId(
  operation:
    | OpenAPIV3.OperationObject
    | OpenAPIV2.OperationObject
    | OpenAPIV3_1.OperationObject,
  method: string,
  path: string
): string {
  if (operation.operationId) {
    return operation.operationId;
  }
  // Generate from method + path
  const sanitizedPath = path.replace(/[^a-zA-Z0-9]/g, '');
  return `${method}${sanitizedPath}`;
}

/**
 * Extracts status codes from OpenAPI responses object.
 */
function extractStatusCodes(
  responses:
    | OpenAPIV3.ResponsesObject
    | OpenAPIV2.ResponsesObject
    | OpenAPIV3_1.ResponsesObject
    | undefined
): {
  code: number;
  description: string;
  messageModule?: string;
  messageType?: string;
}[] {
  if (!responses) {return [];}

  return Object.entries(responses)
    .filter(([code]) => code !== 'default' && !isNaN(Number(code)))
    .map(([code, response]) => ({
      code: Number(code),
      description:
        (response as OpenAPIV3.ResponseObject | OpenAPIV2.ResponseObject)
          .description ?? 'Unknown'
    }));
}
