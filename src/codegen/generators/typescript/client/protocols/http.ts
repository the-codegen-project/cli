/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  TypeScriptChannelRenderType,
  TypeScriptChannelRenderedFunctionType
} from '../../channels';
import {
  ensureRelativePath,
  appendImportExtension,
  resolveImportExtension,
  joinPath,
  relativePath
} from '../../../../utils';
import {pascalCase} from '../../utils';
import {TypeScriptClientContext} from '..';
import {
  addParametersToDependencies,
  addParametersToExports,
  addPayloadsToDependencies,
  addPayloadsToExports
} from '../../channels/utils';
import {
  createMissingInputDocumentError,
  createMissingDependencyOutputError
} from '../../../../errors';

const VALID_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Derives the HTTP client class name. An explicit `clientName` wins; otherwise
 * the name is built from the input document title so a "Safepay Nordic API"
 * becomes `SafepayNordicClient`, falling back to `HttpClient`.
 */
export function deriveHttpClientName(context: TypeScriptClientContext): string {
  const explicit = context.generator.clientName?.trim();
  if (explicit) {
    return VALID_IDENTIFIER.test(explicit) ? explicit : pascalCase(explicit);
  }

  const title = getDocumentTitle(context);
  if (!title) {
    return 'HttpClient';
  }
  // Drop a trailing "Api" token so titles ending in "API" don't yield the
  // awkward "...ApiClient" suffix.
  const base = pascalCase(title).replace(/Api$/, '');
  if (base.length === 0) {
    return 'HttpClient';
  }
  return base.endsWith('Client') ? base : `${base}Client`;
}

function getDocumentTitle(
  context: TypeScriptClientContext
): string | undefined {
  if (context.inputType === 'asyncapi' && context.asyncapiDocument) {
    return context.asyncapiDocument.info()?.title();
  }
  if (context.openapiDocument) {
    return context.openapiDocument.info?.title;
  }
  return undefined;
}

/**
 * Renders a single class method that forwards to the standalone channel
 * function, merging the client's shared configuration with the per-call
 * context (per-call values win).
 */
function renderHttpClientMethod(
  func: TypeScriptChannelRenderedFunctionType
): string {
  const {functionName} = func;
  const contextType = `http_client.${pascalCase(functionName)}Context`;
  // Operations without a request body and without path parameters accept an
  // entirely optional context, so the method call can be argument-free.
  const needsContext = Boolean(func.messageType) || Boolean(func.parameterType);
  const contextDefault = needsContext ? '' : ' = {}';
  return `
  /**
   * Invokes the \`${functionName}\` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async ${functionName}(context: ${contextType}${contextDefault}): Promise<Awaited<ReturnType<typeof http_client.${functionName}>>> {
    return http_client.${functionName}({...this.config, ...context});
  }`;
}

export async function generateHttpClient(
  context: TypeScriptClientContext
): Promise<{content: string; className: string}> {
  const {asyncapiDocument, openapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw createMissingInputDocumentError({
      expectedType: 'asyncapi',
      generatorPreset: 'client'
    });
  }
  if (inputType === 'openapi' && openapiDocument === undefined) {
    throw createMissingInputDocumentError({
      expectedType: 'openapi',
      generatorPreset: 'client'
    });
  }
  if (!context.dependencyOutputs) {
    throw createMissingDependencyOutputError({
      generatorPreset: 'client',
      dependencyName: 'dependencyOutputs'
    });
  }
  const channels = context.dependencyOutputs[
    generator.channelsGeneratorId
  ] as TypeScriptChannelRenderType;
  if (!channels) {
    throw createMissingDependencyOutputError({
      generatorPreset: 'client',
      dependencyName: 'channels'
    });
  }

  const renderedFunctions = channels.renderedFunctions;
  const renderedHttpFunctions = renderedFunctions['http_client'] ?? [];

  const payloads = channels.payloadRender;
  const parameters = channels.parameterRender;

  const dependencies: string[] = [];
  const importExtension = resolveImportExtension(
    context.generator,
    context.config
  );
  const modelPayloads = [
    ...Object.values(payloads.operationModels),
    ...Object.values(payloads.channelModels),
    ...Object.values(payloads.otherModels)
  ];
  addPayloadsToDependencies(
    modelPayloads,
    payloads.generator,
    context.generator,
    dependencies,
    importExtension
  );
  addPayloadsToExports(modelPayloads, dependencies);
  addParametersToDependencies(
    parameters.channelModels,
    parameters.generator,
    context.generator,
    dependencies,
    importExtension
  );
  addParametersToExports(parameters.channelModels, dependencies);

  const methods = renderedHttpFunctions.map(renderHttpClientMethod);

  const httpChannelsImportPath = relativePath(
    context.generator.outputPath,
    joinPath(channels.generator.outputPath, 'http_client')
  );
  const channelImportPath = appendImportExtension(
    `./${ensureRelativePath(httpChannelsImportPath)}`,
    importExtension
  );

  const className = deriveHttpClientName(context);
  const title = getDocumentTitle(context);
  const classDescription = title
    ? `A fully-typed HTTP client for the ${title}.`
    : 'A fully-typed HTTP client.';

  const content = `${[...new Set(dependencies)].join('\n')}

//Import channel functions
import * as http_client from '${channelImportPath}';

/**
 * @class ${className}
 *
 * ${classDescription} Construct it once with the shared request configuration
 * (server, auth, hooks, ...) and call the operation methods; every method
 * forwards to the underlying channel function with that configuration applied.
 */
export class ${className} {
  /**
   * @param config shared HTTP configuration applied to every request. Any field
   * can be overridden per call through the method's context argument.
   */
  constructor(private readonly config: http_client.HttpClientContext = {}) {}
  ${methods.join('\n')}
}`;

  return {content, className};
}
