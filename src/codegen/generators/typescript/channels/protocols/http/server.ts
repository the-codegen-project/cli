/**
 * Generates HTTP server stubs for individual API operations.
 *
 * Each operation gets a `register<Op>(context)` function that mounts a typed
 * handler on a caller-supplied Express `Router`. It is the structural inverse
 * of `renderHttpFetchClient`: where the client builds a URL, serializes
 * headers and unmarshals a response, the server extracts parameters from the
 * URL, deserializes headers and marshals the handler's return value.
 */
import {HttpRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {
  ChannelFunctionTypes,
  HttpServerResponseVariant,
  RenderHttpServerParameters
} from '../../types';
import {
  getHeaderTypeAndModule,
  getValidationFunctions,
  parameterInstanceExpression,
  renderChannelJSDoc
} from '../../utils';

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];
const RESPONSE_HEADERS_FIELD = 'headers?: Record<string, string | string[]>';

/**
 * Renders the register function and its supporting types for one operation.
 */
export function renderHttpServerRegister({
  requestTopic,
  method,
  requestMessageType,
  requestMessageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(requestTopic),
  functionName = `register${subName}`,
  description,
  deprecated,
  payloadGenerator,
  hasDeserializeHeaders = false,
  responses
}: RenderHttpServerParameters): HttpRenderType {
  const contextInterfaceName = `${pascalCase(functionName)}Context`;
  const responseTypeName = buildResponseTypeName(functionName);
  const {headerType} = getHeaderTypeAndModule(channelHeaders);
  // OpenAPI header models are always object interfaces, so a union header model
  // (which would come back with a module) cannot occur here; without a
  // `deserialize*` function there is nothing inbound to call either way.
  const usesHeaders = hasDeserializeHeaders && headerType !== undefined;
  const hasBody =
    METHODS_WITH_BODY.includes(method.toUpperCase()) &&
    requestMessageType !== undefined;
  const bodyType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;

  const responseUnion = generateResponseUnion({responseTypeName, responses});
  const contextInterface = generateContextInterface({
    contextInterfaceName,
    responseTypeName,
    bodyType: hasBody ? bodyType : undefined,
    parametersType: channelParameters?.type,
    headersType: usesHeaders ? headerType : undefined
  });
  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `Registers an HTTP ${method.toUpperCase()} handler for ${requestTopic}`
  });
  const implementation = generateRegisterImplementation({
    functionName,
    contextInterfaceName,
    requestTopic,
    method,
    responses,
    hasBody,
    requestMessageType,
    requestMessageModule,
    includeValidation: payloadGenerator.generator.includeValidation === true,
    parameterModelName: channelParameters?.name,
    headersType: usesHeaders ? headerType : undefined,
    jsDoc
  });

  return {
    messageType: hasBody ? bodyType : undefined,
    replyType: responseTypeName,
    code: `${responseUnion}

${contextInterface}

${implementation}`,
    functionName,
    dependencies: [
      "import { NextFunction, Request, Response, Router } from 'express';"
    ],
    functionType: ChannelFunctionTypes.HTTP_SERVER,
    parameterType: channelParameters?.name,
    headerType: usesHeaders ? headerType : undefined
  };
}

/**
 * `registerAddPet` -> `AddPetServerResponse`. The `Register` prefix is dropped
 * so the response type reads as the operation's, not the registration's.
 */
function buildResponseTypeName(functionName: string): string {
  const pascalName = pascalCase(functionName);
  const withoutPrefix = pascalName.replace(/^Register/, '');
  return `${withoutPrefix === '' ? pascalName : withoutPrefix}ServerResponse`;
}

/**
 * The discriminated union of everything the handler may return.
 *
 * `default` has no concrete status, so it becomes a `{status: number}` member
 * placed last. An operation that declared no usable response falls back to an
 * untyped member so the stub still compiles.
 */
function generateResponseUnion({
  responseTypeName,
  responses
}: {
  responseTypeName: string;
  responses: HttpServerResponseVariant[];
}): string {
  if (responses.length === 0) {
    return `export type ${responseTypeName} = {status: number; body?: unknown; ${RESPONSE_HEADERS_FIELD}};`;
  }

  const members = responses.map((variant) => {
    const status =
      variant.statusCode === 'default' ? 'number' : variant.statusCode;
    const body = variant.bodyInputType
      ? `body: ${variant.bodyInputType}; `
      : '';
    return `  | {status: ${status}; ${body}${RESPONSE_HEADERS_FIELD}}`;
  });

  return `export type ${responseTypeName} =
${members.join('\n')};`;
}

/**
 * The context every register function takes: the router to mount on, the
 * handler, and the shared server options.
 */
function generateContextInterface({
  contextInterfaceName,
  responseTypeName,
  bodyType,
  parametersType,
  headersType
}: {
  contextInterfaceName: string;
  responseTypeName: string;
  bodyType?: string;
  parametersType?: string;
  headersType?: string;
}): string {
  const callbackParameters: string[] = [];
  if (bodyType) {
    callbackParameters.push(`    body: ${bodyType};`);
  }
  if (parametersType) {
    callbackParameters.push(`    parameters: ${parametersType};`);
  }
  if (headersType) {
    callbackParameters.push(`    requestHeaders: ${headersType};`);
  }
  // `request` is always handed over for read-only access to anything not
  // modelled (cookies, auth headers, the raw socket). `response` and `next` are
  // deliberately withheld: the typed return value owns the response, and
  // handing them over would make that contract ambiguous.
  callbackParameters.push('    request: Request;');

  return `export interface ${contextInterfaceName} extends HttpServerContext {
  router: Router;
  callback: (params: {
${callbackParameters.join('\n')}
  }) => ${responseTypeName} | Promise<${responseTypeName}>;
}`;
}

/**
 * The marshalling expression for one response variant.
 *
 * An object model is normalized to a class instance first, so a handler may
 * return a plain object literal and still get the model's wire-name mapping. A
 * module-qualified body marshals through its module. Anything else — a non-object
 * union *member*, whose `bodyType` is a bare type expression like `APet[]` with
 * no importable module of its own — falls back to `JSON.stringify`.
 */
function renderVariantMarshal({
  variant,
  source
}: {
  variant: HttpServerResponseVariant;
  source: string;
}): string {
  if (variant.isObjectModel && variant.bodyType) {
    return `${parameterInstanceExpression({
      modelName: variant.bodyType,
      source
    })}.marshal()`;
  }
  if (variant.bodyModule) {
    return `${variant.bodyModule}.marshal(${source})`;
  }
  return `JSON.stringify(${source})`;
}

/**
 * The statements that turn the handler's return value into response text.
 *
 * When the operation declares a `default` response, the union carries a
 * `{status: number}` member that no literal `case` can narrow away, so the
 * concrete cases reach their body through a cast. Without one — the common
 * shape — the narrowing is exact and the generated code stays cast-free.
 */
function generateResponseMarshalling(
  responses: HttpServerResponseVariant[]
): string {
  if (responses.length === 0) {
    return `      const responseBody = result.body === undefined ? undefined : JSON.stringify(result.body);`;
  }

  const bodyCarrying = responses.filter((variant) => variant.bodyType);
  if (bodyCarrying.length === 0) {
    return '      const responseBody = undefined;';
  }

  const hasDefaultVariant = responses.some(
    (variant) => variant.statusCode === 'default'
  );
  const cases = bodyCarrying.map((variant) => {
    // In the `default:` clause TypeScript has already removed every
    // literal-status member, so the body is reachable without a cast.
    const needsCast = hasDefaultVariant && variant.statusCode !== 'default';
    const bodySource = needsCast
      ? `(result as {body: ${variant.bodyInputType}}).body`
      : 'result.body';
    const clause =
      variant.statusCode === 'default'
        ? 'default'
        : `case ${variant.statusCode}`;
    return `        ${clause}: {
          const responsePayload = ${bodySource};
          responseBody = ${renderVariantMarshal({variant, source: 'responsePayload'})};
          break;
        }`;
  });
  const hasDefaultCase = bodyCarrying.some(
    (variant) => variant.statusCode === 'default'
  );
  const fallthrough = hasDefaultCase
    ? ''
    : `
        default:
          break;`;

  return `      let responseBody: string | undefined = undefined;
      switch (result.status) {
${cases.join('\n')}${fallthrough}
      }`;
}

/**
 * The register function itself.
 */
function generateRegisterImplementation({
  functionName,
  contextInterfaceName,
  requestTopic,
  method,
  responses,
  hasBody,
  requestMessageType,
  requestMessageModule,
  includeValidation,
  parameterModelName,
  headersType,
  jsDoc
}: {
  functionName: string;
  contextInterfaceName: string;
  requestTopic: string;
  method: string;
  responses: HttpServerResponseVariant[];
  hasBody: boolean;
  requestMessageType?: string;
  requestMessageModule?: string;
  includeValidation: boolean;
  parameterModelName?: string;
  headersType?: string;
  jsDoc: string;
}): string {
  // `{param}` -> `:param`, with a leading slash guaranteed, exactly as the
  // EventSource Express registration does.
  const routePath = ensureLeadingSlash(
    requestTopic.replace(/{([^}]+)}/g, ':$1')
  );

  const callbackArguments: string[] = [];
  const statements: string[] = [];

  if (hasBody && requestMessageType) {
    const {potentialValidationFunction} = getValidationFunctions({
      includeValidation,
      messageModule: requestMessageModule,
      messageType: requestMessageType,
      // The validation causes travel in the message; `resolveErrorResponse`
      // turns an HttpError without an explicit body into `{message, ...}`.
      onValidationFail: `throw new HttpError(\`Invalid request payload received; $\{JSON.stringify({cause: errors})}\`, 400, 'Bad Request');`,
      skipValidationFlag: 'context.skipRequestValidation'
    });
    const unmarshalTarget = requestMessageModule ?? requestMessageType;
    statements.push('      const receivedData = await readJsonBody(request);');
    if (potentialValidationFunction) {
      // The shared helper renders at zero indentation; line it up with the rest
      // of the route handler body.
      statements.push(
        potentialValidationFunction
          .split('\n')
          .map((line) => `      ${line}`)
          .join('\n')
      );
    }
    // The JSON *text* is passed, not the parsed object: a primitive payload's
    // `unmarshal` JSON-parses its argument, so an already-parsed value would
    // both fail to type-check and throw at runtime.
    statements.push(
      `      const body = ${unmarshalTarget}.unmarshal(JSON.stringify(receivedData));`
    );
    callbackArguments.push('body');
  }

  if (parameterModelName) {
    // `request.url` is mount-relative — Express strips the mount prefix from it
    // but not from `originalUrl` — and `extractPathParameters` anchors its
    // regex against the whole path, so only the mount-relative form matches the
    // template. Using `originalUrl` here silently breaks `app.use('/v2', router)`.
    statements.push(
      `      const parameters = ${parameterModelName}.fromUrl(request.url, '${requestTopic}');`
    );
    callbackArguments.push('parameters');
  }

  if (headersType) {
    statements.push(
      `      const requestHeaders = deserialize${headersType}Headers(request.headers as Record<string, string | string[] | undefined>);`
    );
    callbackArguments.push('requestHeaders');
  }

  callbackArguments.push('request');

  const marshalling = generateResponseMarshalling(responses);
  const validatorCreation =
    hasBody && requestMessageType && includeValidation
      ? // Created once, outside the route handler: compiling an Ajv validator
        // per request would be a real performance problem.
        `  ${
          getValidationFunctions({
            includeValidation,
            messageModule: requestMessageModule,
            messageType: requestMessageType,
            onValidationFail: ''
          }).potentialValidatorCreation
        }\n`
      : '';

  const statementsBlock =
    statements.length > 0 ? `${statements.join('\n')}\n` : '';

  return `${jsDoc}
function ${functionName}(context: ${contextInterfaceName}): void {
${validatorCreation}  context.router.${method.toLowerCase()}('${routePath}', async (request: Request, response: Response, next: NextFunction) => {
    try {
      await context.hooks?.beforeHandler?.({request});
${statementsBlock}      const result = await context.callback({${callbackArguments.join(', ')}});
${marshalling}
      sendResponse({response, status: result.status, body: responseBody, headers: result.headers, additionalHeaders: context.additionalHeaders});
      await context.hooks?.afterHandler?.({request, status: result.status, body: responseBody});
    } catch (error) {
      await handleHandlerError({error, request, response, next, hooks: context.hooks, additionalHeaders: context.additionalHeaders});
    }
  });
}`;
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
