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
import {createMissingInputDocumentError} from '../../../errors';

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

type OpenAPIOperation =
  | OpenAPIV3.OperationObject
  | OpenAPIV2.OperationObject
  | OpenAPIV3_1.OperationObject;

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

  // Process all operations and collect renders
  const renders = processOpenAPIOperations(
    openapiDocument,
    payloads,
    parameters
  );

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
 * Process all OpenAPI operations and generate HTTP client functions.
 */
function processOpenAPIOperations(
  openapiDocument: OpenAPIDocument,
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType
): ReturnType<typeof renderHttpFetchClient>[] {
  const renders: ReturnType<typeof renderHttpFetchClient>[] = [];

  for (const [path, pathItem] of Object.entries(openapiDocument.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const render = processOperation(
        pathItem,
        method,
        path,
        payloads,
        parameters
      );
      if (render) {
        renders.push(render);
      }
    }
  }

  return renders;
}

/**
 * Process a single OpenAPI operation and generate an HTTP client function.
 */
function processOperation(
  pathItem: OpenAPIV3.PathItemObject | OpenAPIV2.PathsObject,
  method: HttpMethod,
  path: string,
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType
): ReturnType<typeof renderHttpFetchClient> | undefined {
  // eslint-disable-next-line security/detect-object-injection
  const operation = (pathItem as Record<string, unknown>)[method] as
    | OpenAPIOperation
    | undefined;
  if (!operation) {
    return undefined;
  }

  const operationId = getOperationId(operation, method, path);
  const hasBody = METHODS_WITH_BODY.includes(method);

  // Look up payloads
  const requestPayload = hasBody
    ? // eslint-disable-next-line security/detect-object-injection
      payloads.operationModels[operationId]
    : undefined;
  const responsePayloadKey = `${operationId}_Response`;
  // eslint-disable-next-line security/detect-object-injection
  const responsePayload = payloads.operationModels[responsePayloadKey];

  // Look up parameters
  // eslint-disable-next-line security/detect-object-injection
  const parameterModel = parameters.channelModels[operationId];

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

  const {messageModule: requestMessageModule, messageType: requestMessageType} =
    requestMessageInfo;
  const {
    messageModule: replyMessageModule,
    messageType: replyMessageType,
    includesStatusCodes: replyIncludesStatusCodes
  } = responseMessageInfo;

  // Skip if no response type (nothing to generate)
  if (!replyMessageType) {
    return undefined;
  }

  // Generate the HTTP client function
  return renderHttpFetchClient({
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
    channelParameters: parameterModel?.model as
      | ConstrainedObjectModel
      | undefined,
    includesStatusCodes: replyIncludesStatusCodes
  });
}

/**
 * Validates the context is for OpenAPI input and has a parsed document.
 */
function validateOpenAPIContext(context: TypeScriptChannelsContext): {
  openapiDocument: OpenAPIDocument;
} {
  const {openapiDocument, inputType} = context;
  if (inputType !== 'openapi') {
    throw createMissingInputDocumentError({
      expectedType: 'openapi',
      generatorPreset: 'channels'
    });
  }
  if (!openapiDocument) {
    throw createMissingInputDocumentError({
      expectedType: 'openapi',
      generatorPreset: 'channels'
    });
  }
  return {openapiDocument};
}

/**
 * Gets the operation ID from an OpenAPI operation.
 * Falls back to generating one from method+path if not present.
 */
function getOperationId(
  operation: OpenAPIOperation,
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
