import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {ChannelPayload, SingleFunctionRenderType} from '../../../types';
import {
  ensureRelativePath,
  appendImportExtension,
  ImportExtension,
  joinPath,
  relativePath
} from '../../../utils';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptParameterRenderType} from '../parameters';
import {TypeScriptHeadersRenderType} from '../headers';
import {
  TypeScriptChannelsContext,
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes
} from './types';
import {ChannelInterface, OperationInterface} from '@asyncapi/parser';
import {Logger} from '../../../../LoggingInterface';

export function addPayloadsToDependencies(
  models: ChannelPayload[],
  payloadGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[],
  importExtension: ImportExtension = 'none'
) {
  models
    .filter((payload) => payload)
    .forEach((payload) => {
      const payloadImportPath = relativePath(
        currentGenerator.outputPath,
        joinPath(payloadGenerator.outputPath, payload.messageModel.modelName)
      );
      const importPath = appendImportExtension(
        `./${ensureRelativePath(payloadImportPath)}`,
        importExtension
      );
      if (
        payload.messageModel.model instanceof ConstrainedObjectModel ||
        payload.messageModel.model instanceof ConstrainedEnumModel
      ) {
        dependencies.push(
          `import {${payload.messageModel.modelName}} from '${importPath}';`
        );
      } else {
        dependencies.push(
          `import * as ${payload.messageModel.modelName}Module from '${importPath}';`
        );
      }
    });
}
export function addPayloadsToExports(
  models: ChannelPayload[],
  dependencies: string[]
) {
  models
    .filter((payload) => payload)
    .forEach((payload) => {
      if (
        payload.messageModel.model instanceof ConstrainedObjectModel ||
        payload.messageModel.model instanceof ConstrainedEnumModel
      ) {
        dependencies.push(`export {${payload.messageModel.modelName}};`);
      } else {
        dependencies.push(`export {${payload.messageModel.modelName}Module};`);
      }
    });
}
export function addParametersToDependencies(
  parameters: Record<string, OutputModel | undefined>,
  parameterGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[],
  importExtension: ImportExtension = 'none'
) {
  Object.values(parameters)
    .filter((model) => model !== undefined)
    .forEach((parameter) => {
      if (parameter === undefined) {
        return;
      }
      const parameterImportPath = relativePath(
        currentGenerator.outputPath,
        joinPath(parameterGenerator.outputPath, parameter.modelName)
      );
      const importPath = appendImportExtension(
        `./${ensureRelativePath(parameterImportPath)}`,
        importExtension
      );

      dependencies.push(
        `import {${parameter.modelName}} from '${importPath}';`
      );
    });
}
export function addParametersToExports(
  parameters: Record<string, OutputModel | undefined>,
  dependencies: string[]
) {
  Object.values(parameters)
    .filter((model) => model !== undefined)
    .forEach((parameter) => {
      if (parameter === undefined) {
        return;
      }
      dependencies.push(`export {${parameter.modelName}};`);
    });
}

export function addHeadersToDependencies(
  headers: Record<string, OutputModel | undefined>,
  headerGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[],
  importExtension: ImportExtension = 'none'
) {
  Object.values(headers)
    .filter((model) => model !== undefined)
    .forEach((header) => {
      if (header === undefined) {
        return;
      }
      const headerImportPath = relativePath(
        currentGenerator.outputPath,
        joinPath(headerGenerator.outputPath, header.modelName)
      );
      const importPath = appendImportExtension(
        `./${ensureRelativePath(headerImportPath)}`,
        importExtension
      );

      dependencies.push(`import {${header.modelName}} from '${importPath}';`);
    });
}
export function getMessageTypeAndModule(payload: ChannelPayload) {
  if (payload === undefined) {
    return {
      messageType: undefined,
      messageModule: undefined,
      includesStatusCodes: false
    };
  }
  let messageModule;
  if (!(payload.messageModel.model instanceof ConstrainedObjectModel)) {
    // Use modelName for module name since messageType may contain invalid identifier characters
    // (e.g., 'Pet[]' for array types). The import is generated using modelName, so we need to match.
    messageModule = `${payload.messageModel.modelName}Module`;
  }

  // Check if this payload has unmarshalByStatusCode support
  // This is set explicitly on the payload, or detected from the model's originalInput
  const includesStatusCodes =
    payload.includesStatusCodes ??
    payload.messageModel.model.originalInput?.[
      'x-modelina-has-status-codes'
    ] === true;

  return {messageType: payload.messageType, messageModule, includesStatusCodes};
}
export function getValidationFunctions({
  includeValidation,
  messageModule,
  messageType,
  onValidationFail
}: {
  includeValidation: boolean;
  messageModule?: string;
  messageType: string;
  onValidationFail: string;
}) {
  let validatorCreation = '';
  let validationFunction = '';
  if (includeValidation) {
    validatorCreation = `const validator = ${messageModule ?? messageType}.createValidator();`;
    validationFunction = `if(!skipMessageValidation) {
    const {valid, errors} = ${messageModule ?? messageType}.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      ${onValidationFail}
    }
  }`;
  }
  return {
    potentialValidatorCreation: validatorCreation,
    potentialValidationFunction: validationFunction
  };
}

/**
 * Collects all payload, parameter, and header imports for a specific protocol's dependencies.
 * This should be called once per protocol to add the necessary imports.
 */
export function collectProtocolDependencies(
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType,
  headers: TypeScriptHeadersRenderType | undefined,
  context: TypeScriptChannelsContext,
  protocolDeps: string[],
  importExtension: ImportExtension = 'none'
) {
  // Add payload imports
  addPayloadsToDependencies(
    Object.values(payloads.operationModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );
  addPayloadsToDependencies(
    Object.values(payloads.channelModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );
  addPayloadsToDependencies(
    Object.values(payloads.otherModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );

  // Add parameter imports
  addParametersToDependencies(
    parameters.channelModels,
    parameters.generator,
    context.generator,
    protocolDeps,
    importExtension
  );

  // Add header imports
  if (headers) {
    addHeadersToDependencies(
      headers.channelModels,
      headers.generator,
      context.generator,
      protocolDeps,
      importExtension
    );
  }
}

/**
 * Escapes special characters in description for JSDoc.
 * Handles closing comment markers and formats multi-line descriptions.
 */
export function escapeJSDocDescription(description: string): string {
  if (!description) {
    return '';
  }
  return description
    .replace(/\*\//g, '*\u2215') // Escape closing comment (use division slash)
    .replace(/\n/g, '\n * '); // Format multi-line with JSDoc prefix
}

/**
 * Renders JSDoc block for channel functions.
 * Uses operation description from API spec when available, falls back to generic text.
 */
export function renderChannelJSDoc(params: {
  description?: string;
  deprecated?: boolean;
  fallbackDescription: string;
  parameters?: Array<{jsDoc: string}>;
}): string {
  const {
    description,
    deprecated,
    fallbackDescription,
    parameters = []
  } = params;

  const desc = description
    ? escapeJSDocDescription(description)
    : escapeJSDocDescription(fallbackDescription);

  const parts = ['/**', ` * ${desc}`];

  if (deprecated) {
    parts.push(' *');
    parts.push(' * @deprecated');
  }

  if (parameters.length > 0) {
    parts.push(' *');
    parameters.forEach((p) => parts.push(p.jsDoc));
  }

  parts.push(' */');

  return parts.join('\n');
}

/**
 * A render object that can carry grouping metadata. Both
 * `SingleFunctionRenderType` and `HttpRenderType` are structurally compatible.
 */
interface GroupableRender {
  tags?: string[];
  pathSegments?: string[];
  method?: string;
}

/**
 * Split a channel address / URL path into its static segments, dropping empty
 * segments and `{param}` placeholders (they are supplied at call time).
 */
export function splitAddressSegments(address: string): string[] {
  return address
    .split('/')
    .filter(
      (segment) =>
        segment.length > 0 &&
        !(segment.startsWith('{') && segment.endsWith('}'))
    );
}

/**
 * Resolve the grouping metadata (tags + path segments) for a rendered function.
 *
 * Tags follow the generation source: an operation-sourced function groups by
 * its operation's tags; a channel-sourced function falls back to the channel's
 * tags when the (v3-only) channel exposes them. AsyncAPI v2 channels have no
 * `tags()` accessor, so the channel lookup is guarded and never throws.
 */
export function resolveGroupingMetadata({
  operation,
  channel,
  topic
}: {
  operation?: OperationInterface;
  channel?: ChannelInterface;
  topic: string;
}): {tags: string[]; pathSegments: string[]} {
  const tags: string[] = [];
  if (operation) {
    tags.push(
      ...operation
        .tags()
        .all()
        .map((tag) => tag.name())
    );
  }
  if (
    tags.length === 0 &&
    channel &&
    typeof (channel as {tags?: unknown}).tags === 'function'
  ) {
    const channelTags = (
      channel as unknown as {
        tags: () => {all: () => {name: () => string}[]} | undefined;
      }
    ).tags();
    if (channelTags && typeof channelTags.all === 'function') {
      tags.push(...channelTags.all().map((tag) => tag.name()));
    }
  }
  return {tags, pathSegments: splitAddressSegments(topic)};
}

/**
 * Attach grouping metadata onto every render in place. Only defined fields are
 * written, so it is safe to call with a partial metadata object.
 */
export function attachGroupingToRenders({
  renders,
  tags,
  pathSegments,
  method
}: {
  renders: GroupableRender[];
  tags?: string[];
  pathSegments?: string[];
  method?: string;
}): void {
  for (const render of renders) {
    if (tags !== undefined) {
      render.tags = tags;
    }
    if (pathSegments !== undefined) {
      render.pathSegments = pathSegments;
    }
    if (method !== undefined) {
      render.method = method;
    }
  }
}

/**
 * Resolve the grouping metadata for a set of renders (via
 * {@link resolveGroupingMetadata}) and attach it to them in one step. Every
 * AsyncAPI protocol calls this from its operation/channel loop so that the
 * resolve-then-attach pair lives in a single place — a protocol can't forget to
 * resolve the metadata before attaching it.
 */
export function attachGroupingMetadata({
  renders,
  operation,
  channel,
  topic
}: {
  renders: GroupableRender[];
  operation?: OperationInterface;
  channel?: ChannelInterface;
  topic: string;
}): void {
  attachGroupingToRenders({
    renders,
    ...resolveGroupingMetadata({operation, channel, topic})
  });
}

/**
 * The minimal render shape {@link addRendersToExternal} consumes. Both
 * `SingleFunctionRenderType` and `HttpRenderType` are structurally assignable.
 */
type RenderForExternal = Pick<
  SingleFunctionRenderType,
  | 'functionName'
  | 'code'
  | 'dependencies'
  | 'functionType'
  | 'tags'
  | 'pathSegments'
  | 'method'
> & {messageType?: string; replyType?: string};

/**
 * Push a protocol's renders into the shared output maps: the raw function code,
 * the external function information (including the `organization` grouping
 * metadata), and the de-duplicated dependency imports.
 *
 * Centralised so every protocol forwards the exact same field set from one
 * place — a new protocol gets `organization` support for free, and the grouping
 * metadata (`tags` / `pathSegments` / `method`) can never be dropped by a
 * hand-rolled per-protocol copy.
 */
export function addRendersToExternal({
  protocol,
  renders,
  protocolCodeFunctions,
  externalProtocolFunctionInformation,
  dependencies,
  parameter
}: {
  protocol: string;
  renders: RenderForExternal[];
  protocolCodeFunctions: Record<string, string[]>;
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >;
  dependencies: string[];
  parameter?: ConstrainedObjectModel;
}): void {
  // eslint-disable-next-line security/detect-object-injection
  protocolCodeFunctions[protocol].push(...renders.map((value) => value.code));
  // eslint-disable-next-line security/detect-object-injection
  externalProtocolFunctionInformation[protocol].push(
    ...renders.map((value) => ({
      functionType: value.functionType,
      functionName: value.functionName,
      messageType: value.messageType ?? '',
      replyType: value.replyType,
      parameterType: parameter?.type,
      tags: value.tags,
      pathSegments: value.pathSegments,
      method: value.method
    }))
  );
  const renderedDependencies = renders
    .map((value) => value.dependencies)
    .flat(Infinity);
  dependencies.push(...(new Set(renderedDependencies) as unknown as string[]));
}

/**
 * A nested grouping tree. A string leaf is the bare function name to be
 * referenced as `<internalName>.<leaf>`; a nested object is a further level.
 */
export interface GroupTree {
  [key: string]: string | GroupTree;
}

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Format an object-literal key, quoting it when it is not a valid JS
 * identifier (e.g. a tag or path segment containing a hyphen or space).
 */
function formatObjectKey(key: string): string {
  return VALID_IDENTIFIER.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
}

/**
 * Group rendered functions by their first tag (one level). Functions without a
 * tag fall into the `untagged` bucket. Leaf key = function name (verbatim).
 */
export function groupByTag(
  functions: TypeScriptChannelRenderedFunctionType[]
): GroupTree {
  const tree: GroupTree = {};
  for (const fn of functions) {
    const tag = fn.tags?.[0] ?? 'untagged';
    // eslint-disable-next-line security/detect-object-injection
    const bucket = (tree[tag] as GroupTree | undefined) ?? {};
    bucket[fn.functionName] = fn.functionName;
    // eslint-disable-next-line security/detect-object-injection
    tree[tag] = bucket;
  }
  return tree;
}

/**
 * Clean, action-style leaf keys for the `path` organization when a render has
 * no HTTP method (i.e. AsyncAPI). Mirrors the OpenAPI method leaf so that
 * `nats.user.signedup.publish` reads like `http_client.pet.put` instead of
 * repeating the verbose function name. `HTTP_CLIENT` is intentionally absent:
 * it always carries a `method`, which takes precedence over this map.
 */
const FUNCTION_TYPE_PATH_LEAF: Partial<Record<ChannelFunctionTypes, string>> = {
  [ChannelFunctionTypes.NATS_PUBLISH]: 'publish',
  [ChannelFunctionTypes.NATS_SUBSCRIBE]: 'subscribe',
  [ChannelFunctionTypes.NATS_REQUEST]: 'request',
  [ChannelFunctionTypes.NATS_REPLY]: 'reply',
  [ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH]: 'jetStreamPublish',
  [ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE]:
    'jetStreamPullSubscribe',
  [ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE]:
    'jetStreamPushSubscribe',
  [ChannelFunctionTypes.MQTT_PUBLISH]: 'publish',
  [ChannelFunctionTypes.MQTT_SUBSCRIBE]: 'subscribe',
  [ChannelFunctionTypes.KAFKA_PUBLISH]: 'publish',
  [ChannelFunctionTypes.KAFKA_SUBSCRIBE]: 'subscribe',
  [ChannelFunctionTypes.AMQP_QUEUE_PUBLISH]: 'publish',
  [ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE]: 'subscribe',
  [ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH]: 'publishToExchange',
  [ChannelFunctionTypes.EVENT_SOURCE_FETCH]: 'fetch',
  [ChannelFunctionTypes.EVENT_SOURCE_EXPRESS]: 'express',
  [ChannelFunctionTypes.WEBSOCKET_PUBLISH]: 'publish',
  [ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE]: 'subscribe',
  [ChannelFunctionTypes.WEBSOCKET_REGISTER]: 'register'
};

/**
 * Walk the tree along a function's static path segments, creating intermediate
 * nodes as needed. Returns the target node, or `null` (with a warning) when a
 * segment collides with an existing leaf — nesting into it would silently drop
 * that leaf's function.
 */
function descendToPathNode(
  tree: GroupTree,
  fn: TypeScriptChannelRenderedFunctionType
): GroupTree | null {
  let node = tree;
  for (const segment of fn.pathSegments ?? []) {
    // eslint-disable-next-line security/detect-object-injection
    const existing = node[segment];
    if (typeof existing === 'string') {
      Logger.warn(
        `Channel organization 'path': segment '${segment}' collides with an existing leaf ('${existing}'); skipping ${fn.functionName}.`
      );
      return null;
    }
    if (existing === undefined) {
      // eslint-disable-next-line security/detect-object-injection
      node[segment] = {};
    }
    // eslint-disable-next-line security/detect-object-injection
    node = node[segment] as GroupTree;
  }
  return node;
}

/**
 * Resolve the leaf key for a function at a node: the clean action/method leaf,
 * falling back to the unique function name on collision so nothing is dropped.
 * Returns `null` (with a warning) only if the function name itself collides.
 */
function resolvePathLeafKey(
  node: GroupTree,
  fn: TypeScriptChannelRenderedFunctionType
): string | null {
  const preferredLeaf =
    // eslint-disable-next-line security/detect-object-injection
    fn.method ?? FUNCTION_TYPE_PATH_LEAF[fn.functionType] ?? fn.functionName;
  // eslint-disable-next-line security/detect-object-injection
  const preferredTaken = node[preferredLeaf] !== undefined;
  const leafKey =
    preferredTaken && preferredLeaf !== fn.functionName
      ? fn.functionName
      : preferredLeaf;
  // eslint-disable-next-line security/detect-object-injection
  const existingLeaf = node[leafKey];
  if (existingLeaf !== undefined) {
    Logger.warn(
      `Channel organization 'path': leaf key '${leafKey}' collides at the same node; keeping the first (${String(
        existingLeaf
      )}), skipping ${fn.functionName}.`
    );
    return null;
  }
  return leafKey;
}

/**
 * Nest rendered functions through their static path segments. The leaf key is
 * the HTTP method for OpenAPI, and a clean action verb (see
 * {@link FUNCTION_TYPE_PATH_LEAF}) for AsyncAPI. On a leaf-key collision the
 * function's (unique) name is used as the leaf instead, so no function is ever
 * silently dropped. If even that collides, or a path segment clashes with an
 * existing leaf, the function is skipped with a warning.
 */
export function groupByPath(
  functions: TypeScriptChannelRenderedFunctionType[]
): GroupTree {
  const tree: GroupTree = {};
  for (const fn of functions) {
    const node = descendToPathNode(tree, fn);
    if (node === null) {
      continue;
    }
    const leafKey = resolvePathLeafKey(node, fn);
    if (leafKey === null) {
      continue;
    }
    // eslint-disable-next-line security/detect-object-injection
    node[leafKey] = fn.functionName;
  }
  return tree;
}

/**
 * Render the channel barrel `index.ts` content for a given organization style.
 * The per-protocol `<protocol>.ts` files never change between styles — only
 * this barrel does: `flat` re-exports each protocol namespace, while `tag`/
 * `path` emit a grouped `const` object literal per protocol.
 */
export function renderChannelIndex({
  generatedProtocols,
  externalProtocolFunctionInformation,
  organization,
  importExtension
}: {
  generatedProtocols: string[];
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >;
  organization: 'flat' | 'tag' | 'path';
  importExtension: ImportExtension;
}): string {
  if (generatedProtocols.length === 0) {
    return '// No protocols generated\n';
  }
  if (organization === 'flat') {
    const imports = generatedProtocols
      .map(
        (protocol) =>
          `import * as ${protocol} from '${appendImportExtension(
            `./${protocol}`,
            importExtension
          )}';`
      )
      .join('\n');
    return `${imports}\n\nexport {${generatedProtocols.join(', ')}};\n`;
  }
  const imports: string[] = [];
  const constDeclarations: string[] = [];
  for (const protocol of generatedProtocols) {
    const internalName = `internal_${protocol}`;
    // eslint-disable-next-line security/detect-object-injection
    const functions = externalProtocolFunctionInformation[protocol] || [];
    const tree =
      organization === 'tag' ? groupByTag(functions) : groupByPath(functions);
    imports.push(
      `import * as ${internalName} from '${appendImportExtension(
        `./${protocol}`,
        importExtension
      )}';`
    );
    constDeclarations.push(
      `export const ${protocol} = ${renderObjectLiteral({
        tree,
        internalName
      })} as const;`
    );
  }
  return `${imports.join('\n')}\n\n${constDeclarations.join('\n\n')}\n`;
}

/**
 * Render a grouping tree as a TypeScript object literal whose leaves reference
 * `<internalName>.<functionName>`.
 */
export function renderObjectLiteral({
  tree,
  internalName,
  indentLevel = 1
}: {
  tree: GroupTree;
  internalName: string;
  indentLevel?: number;
}): string {
  const pad = '  '.repeat(indentLevel);
  const closePad = '  '.repeat(indentLevel - 1);
  const entries = Object.entries(tree).map(([key, value]) => {
    const formattedKey = formatObjectKey(key);
    if (typeof value === 'string') {
      return `${pad}${formattedKey}: ${internalName}.${value}`;
    }
    return `${pad}${formattedKey}: ${renderObjectLiteral({
      tree: value,
      internalName,
      indentLevel: indentLevel + 1
    })}`;
  });
  return `{\n${entries.join(',\n')}\n${closePad}}`;
}
