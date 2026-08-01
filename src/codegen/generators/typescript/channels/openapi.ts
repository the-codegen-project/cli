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
  TypeScriptChannelsContext,
  HttpServerResponseVariant
} from './types';
import {ChannelPayload} from '../../../types';
import {
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedReferenceModel,
  ConstrainedUnionModel
} from '@asyncapi/modelina';
import {
  collectProtocolDependencies,
  addRendersToExternal,
  parameterUnionType,
  payloadUnionType
} from './utils';
import {
  renderHttpFetchClient,
  renderHttpCommonTypes,
  renderHttpServerCommonTypes,
  renderHttpServerRegister,
  analyzeSecuritySchemes
} from './protocols/http';
import {getMessageTypeAndModule, splitAddressSegments} from './utils';
import {camelCase, pascalCase} from '../utils';
import {createMissingInputDocumentError} from '../../../errors';
import {resolveImportExtension} from '../../../utils';
import {Logger} from '../../../../LoggingInterface';
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
 * The pieces every OpenAPI protocol path needs. Grouped so the dispatcher can
 * hand the same bundle to each branch.
 */
interface OpenAPIProtocolGenerationContext {
  context: TypeScriptChannelsContext;
  openapiDocument: OpenAPIDocument;
  parameters: TypeScriptParameterRenderType;
  payloads: TypeScriptPayloadRenderType;
  headers: TypeScriptHeadersRenderType;
  protocolCodeFunctions: Record<string, string[]>;
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >;
  protocolDependencies: Record<string, string[]>;
}

/**
 * Generates TypeScript channels from an OpenAPI document.
 *
 * OpenAPI input supports the two HTTP protocols: `http_client` (outbound
 * request functions) and `http_server` (inbound Express handler stubs). Every
 * other protocol is silently skipped — `finalizeGeneration` already warns when
 * a generation produced nothing at all.
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
  const supportedProtocols = protocolsToUse.filter(
    (protocol) => protocol === 'http_client' || protocol === 'http_server'
  );
  if (supportedProtocols.length === 0) {
    return;
  }

  const {openapiDocument} = validateOpenAPIContext(context);
  const generationContext: OpenAPIProtocolGenerationContext = {
    context,
    openapiDocument,
    parameters,
    payloads,
    headers,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    protocolDependencies
  };

  for (const protocol of supportedProtocols) {
    switch (protocol) {
      case 'http_client':
        generateOpenAPIHttpClientChannels(generationContext);
        break;
      case 'http_server':
        generateOpenAPIHttpServerChannels(generationContext);
        break;
      default:
        // Unreachable: `supportedProtocols` only ever holds the two above.
        break;
    }
  }
}

/**
 * Collect the payload/parameter/header imports for one protocol file.
 */
function collectDependenciesForProtocol({
  protocol,
  generationContext
}: {
  protocol: 'http_client' | 'http_server';
  generationContext: OpenAPIProtocolGenerationContext;
}): string[] {
  const {context, parameters, payloads, headers, protocolDependencies} =
    generationContext;
  // eslint-disable-next-line security/detect-object-injection
  const deps = protocolDependencies[protocol];
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
  return deps;
}

function generateOpenAPIHttpClientChannels(
  generationContext: OpenAPIProtocolGenerationContext
): void {
  const {
    openapiDocument,
    parameters,
    payloads,
    headers,
    protocolCodeFunctions,
    externalProtocolFunctionInformation
  } = generationContext;

  // Extract security schemes from the OpenAPI document
  const securitySchemes = extractSecuritySchemes(openapiDocument);
  const deps = collectDependenciesForProtocol({
    protocol: 'http_client',
    generationContext
  });

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

function generateOpenAPIHttpServerChannels(
  generationContext: OpenAPIProtocolGenerationContext
): void {
  const {
    openapiDocument,
    parameters,
    payloads,
    headers,
    protocolCodeFunctions,
    externalProtocolFunctionInformation
  } = generationContext;

  const deps = collectDependenciesForProtocol({
    protocol: 'http_server',
    generationContext
  });

  const renders = processOpenAPIServerOperations({
    openapiDocument,
    payloads,
    parameters,
    headers
  });

  if (protocolCodeFunctions['http_server'].length === 0 && renders.length > 0) {
    protocolCodeFunctions['http_server'].unshift(renderHttpServerCommonTypes());
  }

  addRendersToExternal({
    protocol: 'http_server',
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
/**
 * Collect HTTP(S) server URLs from an OpenAPI document as quoted string
 * literals for the generated client's default baseURL. Server variables are
 * substituted with their defaults; a server whose variable has no default, or
 * whose URL is relative/non-HTTP, cannot be a baseURL and is skipped.
 */
function getOpenAPIHttpServerUrls(openapiDocument: OpenAPIDocument): string[] {
  const servers = (
    openapiDocument as {
      servers?: Array<{
        url?: string;
        variables?: Record<string, {default?: string}>;
      }>;
    }
  ).servers;
  if (!Array.isArray(servers)) {
    // Swagger/OpenAPI 2.0 has no `servers`; the base URL is assembled from
    // `schemes` + `host` + `basePath` instead. Without this the generated
    // client silently falls back to localhost for every 2.0 document.
    return getSwagger2ServerUrls(openapiDocument);
  }
  const urls: string[] = [];
  for (const server of servers) {
    let url = server.url;
    if (!url) {
      continue;
    }
    const variableTokens = url.match(/\{([^}]+)\}/g) ?? [];
    let skip = false;
    for (const token of variableTokens) {
      const name = token.slice(1, -1);
      // eslint-disable-next-line security/detect-object-injection
      const defaultValue = server.variables?.[name]?.default;
      if (defaultValue === undefined) {
        Logger.warn(
          `OpenAPI server URL '${server.url}' has no default for variable '${name}' and was skipped as a baseURL`
        );
        skip = true;
        break;
      }
      url = url.replace(token, defaultValue);
    }
    if (skip) {
      continue;
    }
    if (!/^https?:\/\//i.test(url)) {
      Logger.verbose(
        `OpenAPI server URL '${url}' is relative or non-HTTP and was skipped as a baseURL`
      );
      continue;
    }
    urls.push(`'${url}'`);
  }
  return urls;
}

/**
 * Assemble base URLs for a Swagger/OpenAPI 2.0 document from `schemes`,
 * `host` and `basePath`. `https` is preferred when the document offers both,
 * and a document without a `host` yields nothing (a bare `basePath` is
 * relative and cannot serve as a baseURL).
 */
function getSwagger2ServerUrls(openapiDocument: OpenAPIDocument): string[] {
  const {host, basePath, schemes} = openapiDocument as {
    host?: string;
    basePath?: string;
    schemes?: string[];
  };
  if (!host) {
    return [];
  }

  const httpSchemes = (schemes ?? ['https']).filter((scheme) =>
    ['http', 'https'].includes(scheme.toLowerCase())
  );
  if (httpSchemes.length === 0) {
    Logger.warn(
      `Swagger 2.0 document declares host '${host}' but no http/https scheme; no default baseURL was generated`
    );
    return [];
  }

  const orderedSchemes = httpSchemes.includes('https')
    ? ['https', ...httpSchemes.filter((scheme) => scheme !== 'https')]
    : httpSchemes;

  // A basePath is required by 2.0 to start with `/`; tolerate one that does not.
  let normalizedBasePath = basePath ?? '';
  if (normalizedBasePath === '/') {
    normalizedBasePath = '';
  } else if (normalizedBasePath && !normalizedBasePath.startsWith('/')) {
    normalizedBasePath = `/${normalizedBasePath}`;
  }

  return orderedSchemes.map(
    (scheme) => `'${scheme.toLowerCase()}://${host}${normalizedBasePath}'`
  );
}

function processOpenAPIOperations(
  openapiDocument: OpenAPIDocument,
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType,
  headers: TypeScriptHeadersRenderType,
  oauth2Enabled: boolean
): ReturnType<typeof renderHttpFetchClient>[] {
  const renders: ReturnType<typeof renderHttpFetchClient>[] = [];
  const servers = getOpenAPIHttpServerUrls(openapiDocument);

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
        oauth2Enabled,
        servers
      );
      if (render) {
        renders.push(render);
      }
    }
  }

  return renders;
}

/**
 * The models the payload/parameter/header generators produced for one
 * operation.
 *
 * The correlation key is `deriveOperationId`, and it has to stay identical
 * across the client and server paths — otherwise a generated server stub and
 * its generated client would disagree about which model belongs to which
 * operation. Doing the lookups in one place is what guarantees that.
 */
function correlateOperationModels({
  operationId,
  hasBody,
  payloads,
  parameters,
  headers
}: {
  operationId: string;
  hasBody: boolean;
  payloads: TypeScriptPayloadRenderType;
  parameters: TypeScriptParameterRenderType;
  headers: TypeScriptHeadersRenderType;
}) {
  /* eslint-disable security/detect-object-injection */
  return {
    requestPayload: hasBody ? payloads.operationModels[operationId] : undefined,
    responsePayload: payloads.operationModels[`${operationId}_Response`],
    parameterModel: parameters.channelModels[operationId],
    headersModel: headers.channelModels[operationId]
  };
  /* eslint-enable security/detect-object-injection */
}

/**
 * Iterate every operation in the document and render its server stub.
 */
function processOpenAPIServerOperations({
  openapiDocument,
  payloads,
  parameters,
  headers
}: {
  openapiDocument: OpenAPIDocument;
  payloads: TypeScriptPayloadRenderType;
  parameters: TypeScriptParameterRenderType;
  headers: TypeScriptHeadersRenderType;
}): ReturnType<typeof renderHttpServerRegister>[] {
  const renders: ReturnType<typeof renderHttpServerRegister>[] = [];

  for (const [path, pathItem] of Object.entries(openapiDocument.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const render = processServerOperation({
        pathItem,
        method,
        path,
        payloads,
        parameters,
        headers
      });
      if (render) {
        renders.push(render);
      }
    }
  }

  return renders;
}

/**
 * Render a single operation's server stub.
 *
 * Unlike the client, an operation is never skipped for lacking a response
 * body: a server has to register a route for every operation the document
 * declares, or requests to it would 404.
 */
function processServerOperation({
  pathItem,
  method,
  path,
  payloads,
  parameters,
  headers
}: {
  pathItem: OpenAPIV3.PathItemObject | OpenAPIV2.PathsObject;
  method: HttpMethod;
  path: string;
  payloads: TypeScriptPayloadRenderType;
  parameters: TypeScriptParameterRenderType;
  headers: TypeScriptHeadersRenderType;
}): ReturnType<typeof renderHttpServerRegister> | undefined {
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
  const {requestPayload, responsePayload, parameterModel, headersModel} =
    correlateOperationModels({
      operationId,
      hasBody,
      payloads,
      parameters,
      headers
    });

  const {messageModule: requestMessageModule, messageType: requestMessageType} =
    requestPayload
      ? getMessageTypeAndModule(requestPayload)
      : {messageModule: undefined, messageType: undefined};

  const render = renderHttpServerRegister({
    subName: pascalCase(operationId),
    // An operation-id-derived name is stable and shares its source with the
    // client's `camelCase(operationId)`, so the two sides stay recognisably
    // paired.
    functionName: `register${pascalCase(operationId)}`,
    requestTopic: path,
    method: method.toUpperCase() as
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'PATCH'
      | 'DELETE'
      | 'OPTIONS'
      | 'HEAD',
    requestMessageType,
    requestMessageModule,
    channelParameters: parameterModel?.model as
      | ConstrainedObjectModel
      | undefined,
    channelHeaders: headersModel?.model as ConstrainedObjectModel | undefined,
    description: operation.description ?? operation.summary,
    deprecated: operation.deprecated === true,
    payloadGenerator: payloads,
    hasDeserializeHeaders: headersModel !== undefined,
    responses: collectServerResponseVariants({operation, responsePayload})
  });

  // Grouping metadata for the `organization` option, set exactly as the client
  // path sets it.
  render.tags = operation.tags ?? [];
  render.pathSegments = splitAddressSegments(path);
  render.method = method.toLowerCase();

  return render;
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
  oauth2Enabled: boolean,
  servers: string[]
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

  // Look up the payload/parameter/header models for this operation
  const {requestPayload, responsePayload, parameterModel, headersModel} =
    correlateOperationModels({
      operationId,
      hasBody,
      payloads,
      parameters,
      headers
    });

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

  // Status codes this operation declares without a response body. An operation
  // whose responses are all bodyless (the common `DELETE` -> `204` shape) still
  // deserves a client function - dropping it left the user with no function and
  // a warning telling them to set `protocols`, which they already had.
  const noContentStatusCodes = getNoContentStatusCodes(operation);

  // Skip only when the operation declares no responses at all, so there is
  // genuinely nothing to call.
  if (!replyMessageType && noContentStatusCodes.length === 0) {
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
    servers,
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
    hasSerializeHeaders: headersModel !== undefined,
    noContentStatusCodes
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
 * Read the status code a response union member was decorated with, exactly as
 * `modelina/presets/union.ts` does: the decoration sits on the referenced model
 * when the member is a reference to an object, and on the member itself
 * otherwise.
 *
 * `x-modelina-status-codes` is only set for numeric codes, so a `default`
 * response member is identified by the `<operationId>_Response_<code>` `$id`
 * every response schema is decorated with instead.
 */
function extractMemberStatusCode(
  member: ConstrainedMetaModel
): number | 'default' | undefined {
  const originalInput =
    member instanceof ConstrainedReferenceModel
      ? member.ref.originalInput
      : member.originalInput;
  const decoration = originalInput?.['x-modelina-status-codes'];
  if (typeof decoration === 'number') {
    return decoration;
  }
  if (
    decoration &&
    typeof decoration === 'object' &&
    typeof decoration.code === 'number'
  ) {
    return decoration.code;
  }
  return extractStatusCodeFromSchemaId(originalInput?.$id);
}

/**
 * Recover the status code from a decorated response schema's `$id`
 * (`<operationId>_Response_<code>`, set in the OpenAPI payload processor).
 */
function extractStatusCodeFromSchemaId(
  schemaId: unknown
): number | 'default' | undefined {
  if (typeof schemaId !== 'string') {
    return undefined;
  }
  const suffix = schemaId.slice(schemaId.lastIndexOf('_') + 1);
  if (suffix === 'default') {
    return 'default';
  }
  const numericCode = Number(suffix);
  return Number.isInteger(numericCode) ? numericCode : undefined;
}

/**
 * Every status code the operation declares, in the order the generated response
 * union should list them: ascending numerically, with `default` last.
 *
 * Wildcard keys (`2XX`) cannot be returned as a concrete status and are
 * skipped — an operation left with no variants falls back to the untyped
 * `{status: number; body?: unknown}` response in the renderer.
 */
function collectDeclaredStatusCodes(
  operation: OpenAPIOperation
): (number | 'default')[] {
  const responses = (operation as {responses?: Record<string, unknown>})
    .responses;
  if (!responses) {
    return [];
  }

  const numericCodes: number[] = [];
  let hasDefault = false;
  for (const statusCode of Object.keys(responses)) {
    if (statusCode === 'default') {
      hasDefault = true;
      continue;
    }
    const numericCode = Number(statusCode);
    if (Number.isInteger(numericCode)) {
      numericCodes.push(numericCode);
      continue;
    }
    Logger.verbose(
      `OpenAPI response key '${statusCode}' is not a concrete status code and was skipped for the HTTP server response union`
    );
  }

  numericCodes.sort((left, right) => left - right);
  return hasDefault ? [...numericCodes, 'default'] : numericCodes;
}

/**
 * Map each status code that carries a body to the type the generated handler
 * returns for it.
 *
 * Two payload shapes have to be handled, because `createUnionSchema` returns
 * the response schema *directly* when an operation declares exactly one
 * body-carrying response and only builds a `oneOf` union when there are two or
 * more:
 *
 * - a status-code union -> walk its members and read each member's code
 * - anything else -> the single body-carrying response; its code is read from
 *   the model's `$id` suffix, which the payload processor sets authoritatively
 */
function collectResponseBodyTypes(
  responsePayload: ChannelPayload | undefined
): Map<number | 'default', HttpServerResponseVariant> {
  const bodyTypes = new Map<number | 'default', HttpServerResponseVariant>();
  if (!responsePayload) {
    return bodyTypes;
  }

  const model = responsePayload.messageModel.model;
  if (
    model instanceof ConstrainedUnionModel &&
    model.originalInput?.['x-modelina-has-status-codes'] === true
  ) {
    for (const member of model.union) {
      const statusCode = extractMemberStatusCode(member);
      if (statusCode === undefined) {
        continue;
      }
      // A member that references an object model is a class with `marshal()`.
      // Anything else (an array, a primitive, an enum) has no importable module
      // of its own — `member.type` is a bare type expression like `APet[]` — so
      // the renderer falls back to `JSON.stringify` for it.
      const isObjectModel =
        member instanceof ConstrainedReferenceModel &&
        member.ref instanceof ConstrainedObjectModel;
      bodyTypes.set(statusCode, {
        statusCode,
        bodyType: member.type,
        bodyInputType: isObjectModel
          ? parameterUnionType(member.type)
          : member.type,
        isObjectModel
      });
    }
    return bodyTypes;
  }

  const {messageType, messageModule} = getMessageTypeAndModule(responsePayload);
  if (!messageType) {
    return bodyTypes;
  }
  const statusCode = extractStatusCodeFromSchemaId(model.originalInput?.$id);
  if (statusCode === undefined) {
    return bodyTypes;
  }
  bodyTypes.set(statusCode, {
    statusCode,
    bodyType: messageModule ? `${messageModule}.${messageType}` : messageType,
    bodyInputType: payloadUnionType({messageType, messageModule}),
    bodyModule: messageModule,
    isObjectModel: messageModule === undefined
  });
  return bodyTypes;
}

/**
 * The ordered set of responses a generated server handler may return for one
 * operation.
 *
 * Declared-but-bodyless codes exist only in the raw document (the petstore's
 * `addPet` declares `405` with no content), so the list is assembled from the
 * raw `responses` keys unioned with the model-derived body types — neither
 * source alone is complete.
 */
export function collectServerResponseVariants({
  operation,
  responsePayload
}: {
  operation: OpenAPIOperation;
  responsePayload: ChannelPayload | undefined;
}): HttpServerResponseVariant[] {
  const bodyTypes = collectResponseBodyTypes(responsePayload);
  const declaredCodes = collectDeclaredStatusCodes(operation);

  return declaredCodes.map(
    (statusCode) => bodyTypes.get(statusCode) ?? {statusCode}
  );
}

/**
 * Collect the success status codes an operation declares without a response
 * body. A response is bodyless when it declares no `content` (3.x) and no
 * `schema` (2.0) - the shape of `204 No Content`, `205`, `304` and of `202
 * Accepted` responses that return nothing.
 *
 * Error codes are excluded: those are thrown as `HttpError` before the body is
 * ever unmarshalled, so whether they carry a body does not affect the success
 * type.
 */
function getNoContentStatusCodes(operation: OpenAPIOperation): number[] {
  const responses = (operation as {responses?: Record<string, unknown>})
    .responses;
  if (!responses) {
    return [];
  }

  const codes: number[] = [];
  for (const [statusCode, response] of Object.entries(responses)) {
    const code = Number(statusCode);
    if (isNaN(code) || code >= 400) {
      continue;
    }
    if (!response || typeof response !== 'object') {
      continue;
    }
    const {content, schema} = response as {
      content?: Record<string, unknown>;
      schema?: unknown;
    };
    const hasBody =
      (content !== undefined && Object.keys(content).length > 0) ||
      schema !== undefined;
    if (!hasBody) {
      codes.push(code);
    }
  }
  return codes;
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
