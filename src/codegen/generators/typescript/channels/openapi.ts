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
import {collectProtocolDependencies, addRendersToExternal} from './utils';
import {
  renderHttpFetchClient,
  renderHttpCommonTypes,
  analyzeSecuritySchemes
} from './protocols/http';
import {getMessageTypeAndModule, splitAddressSegments} from './utils';
import {camelCase} from '../utils';
import {createMissingInputDocumentError} from '../../../errors';
import {resolveImportExtension} from '../../../utils';
import {extractSecuritySchemes} from '../../../inputs/openapi/security';
import {deriveOperationId} from '../../../inputs/openapi/utils';

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

  const {openapiDocument} = validateOpenAPIContext(context);

  // Extract security schemes from the OpenAPI document
  const securitySchemes = extractSecuritySchemes(openapiDocument);

  // Collect dependencies
  const deps = protocolDependencies['http_client'];
  const importExtension = resolveImportExtension(
    context.generator,
    context.config
  );
  collectProtocolDependencies(
    payloads,
    parameters,
    headers,
    context,
    deps,
    importExtension
  );

  // OAuth2 request handling is only generated when the spec defines an OAuth2
  // scheme; otherwise the narrowed AuthConfig union would make that code fail to
  // type-check.
  const oauth2Enabled = analyzeSecuritySchemes(securitySchemes).oauth2;

  // Process all operations and collect renders
  const renders = processOpenAPIOperations(
    openapiDocument,
    payloads,
    parameters,
    headers,
    oauth2Enabled
  );

  // Generate common types once (stateless check)
  // Pass security schemes to generate only relevant auth types
  if (protocolCodeFunctions['http_client'].length === 0 && renders.length > 0) {
    const errorStatusCodes = collectErrorStatusCodes(openapiDocument);
    const commonTypesCode = renderHttpCommonTypes({
      securitySchemes,
      errorStatusCodes
    });
    protocolCodeFunctions['http_client'].unshift(commonTypesCode);
  }

  // Add renders (code + external function information + dependencies) to output
  // via the shared helper, so the `organization` grouping metadata and the
  // path-parameter model name are forwarded from the same single place every
  // protocol uses.
  addRendersToExternal({
    protocol: 'http_client',
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies: deps
  });
}

/**
 * Collect the error status codes declared across every operation in the
 * document. Numeric response keys >= 400 and the literal 'default' are gathered
 * and deduped; 2xx/3xx keys are ignored. These drive the explicit cases in the
 * shared, document-wide `handleHttpError`. Handles OpenAPI 2.0/3.0/3.1
 * uniformly (response keys are strings in all three).
 */
function collectResponseErrorCodes(
  responses: Record<string, unknown> | undefined,
  codes: Set<number | 'default'>
): void {
  if (!responses) {
    return;
  }

  for (const statusCode of Object.keys(responses)) {
    if (statusCode === 'default') {
      codes.add('default');
      continue;
    }
    const numericCode = Number(statusCode);
    if (Number.isInteger(numericCode) && numericCode >= 400) {
      codes.add(numericCode);
    }
  }
}

function collectErrorStatusCodes(
  openapiDocument: OpenAPIDocument
): (number | 'default')[] {
  const codes = new Set<number | 'default'>();

  for (const pathItem of Object.values(openapiDocument.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      // eslint-disable-next-line security/detect-object-injection
      const operation = (pathItem as Record<string, unknown>)[method] as
        | OpenAPIOperation
        | undefined;
      collectResponseErrorCodes(
        operation?.responses as Record<string, unknown> | undefined,
        codes
      );
    }
  }

  return [...codes];
}

/**
 * Process all OpenAPI operations and generate HTTP client functions.
 */
function processOpenAPIOperations(
  openapiDocument: OpenAPIDocument,
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType,
  headers: TypeScriptHeadersRenderType,
  oauth2Enabled: boolean
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
        parameters,
        headers,
        oauth2Enabled
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
  parameters: TypeScriptParameterRenderType,
  headers: TypeScriptHeadersRenderType,
  oauth2Enabled: boolean
): ReturnType<typeof renderHttpFetchClient> | undefined {
  // eslint-disable-next-line security/detect-object-injection
  const operation = (pathItem as Record<string, unknown>)[method] as
    | OpenAPIOperation
    | undefined;
  if (!operation) {
    return undefined;
  }

  const operationId = deriveOperationId({
    operationId: operation.operationId,
    method,
    path
  });
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

  // Look up headers
  // eslint-disable-next-line security/detect-object-injection
  const headersModel = headers.channelModels[operationId];

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

  // Extract operation metadata for JSDoc
  const description = operation.description ?? operation.summary;
  const deprecated = operation.deprecated === true;

  // Generate the HTTP client function.
  // Use the operationId directly as the function name; the HTTP method is
  // already encoded in synthesized ids (and meaningful in spec-provided ones),
  // so prepending the method here would double the verb (e.g. getGetUser).
  const render = renderHttpFetchClient({
    functionName: camelCase(operationId),
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
    channelHeaders: headersModel?.model as ConstrainedObjectModel | undefined,
    includesStatusCodes: replyIncludesStatusCodes,
    description,
    deprecated,
    oauth2Enabled,
    hasSerializeHeaders: headersModel !== undefined
  });

  // Grouping metadata for the `organization` option (consumed in
  // finalizeGeneration). tag → operation tag; path → static path segments with
  // the HTTP method as the leaf.
  render.tags = operation.tags ?? [];
  render.pathSegments = splitAddressSegments(path);
  render.method = method.toLowerCase();

  return render;
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
