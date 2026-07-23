/* eslint-disable security/detect-object-injection */
import {AsyncAPIDocumentInterface, ChannelInterface} from '@asyncapi/parser';
import {InputFilter, matchesFilter, normalizeFilter} from '../../filter';
import {findOperationId} from '../../utils';
import {Logger} from '../../../LoggingInterface';

interface RetentionSets {
  channelIds: Set<string>;
  /** v3: retained operation ids (keys of the top-level `operations` map). */
  operationIds: Set<string>;
  /** v2: retained `${channelId}::${action}` keys (publish/subscribe). */
  v2OperationKeys: Set<string>;
}

/**
 * Build the list of candidate strings a channel is matched against: its id and,
 * when present and distinct, its address.
 */
function channelCandidates(channel: ChannelInterface): string[] {
  const candidates = [channel.id()];
  const address = channel.address();
  if (address && address !== channel.id()) {
    candidates.push(address);
  }
  return candidates;
}

/**
 * Decide, from the parsed model, which channels and operations to retain.
 * A channel is retained when it matches directly or has ≥1 retained operation.
 */
function computeRetentionSets({
  document,
  filter
}: {
  document: AsyncAPIDocumentInterface;
  filter: InputFilter;
}): RetentionSets {
  const {include, exclude} = normalizeFilter(filter);
  const sets: RetentionSets = {
    channelIds: new Set(),
    operationIds: new Set(),
    v2OperationKeys: new Set()
  };
  for (const channel of document.allChannels().all()) {
    const chCandidates = channelCandidates(channel);
    const keepChannelDirect = matchesFilter({
      candidates: chCandidates,
      include,
      exclude
    });
    let keepAnyOperation = false;
    for (const operation of channel.operations().all()) {
      const operationId = findOperationId(operation, channel);
      const keepOperation = matchesFilter({
        candidates: [operationId, ...chCandidates],
        include,
        exclude
      });
      if (keepOperation) {
        keepAnyOperation = true;
        const modelId = operation.id();
        if (modelId) {
          sets.operationIds.add(modelId);
        }
        sets.v2OperationKeys.add(`${channel.id()}::${operation.action()}`);
      }
    }
    if (keepChannelDirect || keepAnyOperation) {
      sets.channelIds.add(channel.id());
    }
  }
  return sets;
}

/**
 * Recursively collect every `x-parser-schema-id` reachable from a node. Used to
 * determine which `components.schemas` entries are still referenced after
 * channels/operations have been removed, so orphans can be pruned.
 */
function collectSchemaIds(node: unknown, accumulator: Set<string>): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const value of node) {
      collectSchemaIds(value, accumulator);
    }
    return;
  }
  const record = node as Record<string, unknown>;
  const schemaId = record['x-parser-schema-id'];
  if (typeof schemaId === 'string') {
    accumulator.add(schemaId);
  }
  for (const value of Object.values(record)) {
    collectSchemaIds(value, accumulator);
  }
}

/**
 * Prune `components.schemas` entries that are no longer reachable from the
 * retained channels/operations. Mutates the passed JSON in place.
 */
function pruneOrphanSchemas(json: Record<string, any>): void {
  const schemas = json.components?.schemas;
  if (!schemas || typeof schemas !== 'object') {
    return;
  }
  const reachable = new Set<string>();
  collectSchemaIds(json.channels, reachable);
  collectSchemaIds(json.operations, reachable);
  const pruned: string[] = [];
  for (const name of Object.keys(schemas)) {
    if (!reachable.has(name)) {
      delete schemas[name];
      pruned.push(name);
    }
  }
  if (pruned.length > 0) {
    Logger.debug(
      `Filter pruned orphaned AsyncAPI component schemas: ${pruned.join(', ')}`
    );
  }
}

/** Remove non-retained channels from the top-level `channels` map. */
function removeChannels({
  json,
  retained
}: {
  json: Record<string, any>;
  retained: Set<string>;
}): void {
  if (!json.channels || typeof json.channels !== 'object') {
    return;
  }
  for (const channelId of Object.keys(json.channels)) {
    if (!retained.has(channelId)) {
      delete json.channels[channelId];
    }
  }
}

/**
 * v3 surgery: drop non-retained top-level operations, then drop the redundant
 * `components.channels`/`operations`/`messages` mirrors. In the resolved JSON
 * these are inlined copies of the top-level maps; leaving them causes
 * `allChannels()`/`allOperations()` to double-count on re-parse.
 */
function applyV3Surgery({
  json,
  retained
}: {
  json: Record<string, any>;
  retained: RetentionSets;
}): void {
  for (const operationId of Object.keys(json.operations)) {
    if (!retained.operationIds.has(operationId)) {
      delete json.operations[operationId];
    }
  }
  if (json.components) {
    delete json.components.channels;
    delete json.components.operations;
    delete json.components.messages;
  }
}

/**
 * v2 surgery: operations live inside their channel as `publish`/`subscribe`;
 * delete the ones not retained.
 */
function applyV2Surgery({
  json,
  retained
}: {
  json: Record<string, any>;
  retained: RetentionSets;
}): void {
  for (const channelId of Object.keys(json.channels ?? {})) {
    const channelJson = json.channels[channelId];
    for (const action of ['publish', 'subscribe']) {
      if (
        channelJson[action] &&
        !retained.v2OperationKeys.has(`${channelId}::${action}`)
      ) {
        delete channelJson[action];
      }
    }
  }
  if (json.components) {
    delete json.components.messages;
  }
}

/**
 * Filter an AsyncAPI document down to the channels/operations selected by
 * `filter`, returning the resulting raw JSON. The caller re-parses the returned
 * JSON with its own parser instance.
 *
 * Matching candidates per surface:
 * - channel: channel id + channel address
 * - operation: operation id + its channel's id + address
 *
 * Component schemas/messages left orphaned by the removals are pruned. Works for
 * both AsyncAPI v2 (operations nested as `publish`/`subscribe` inside channels)
 * and v3 (top-level `operations` map cross-referencing `channels`).
 */
export function filterAsyncapiJson({
  document,
  filter
}: {
  document: AsyncAPIDocumentInterface;
  filter: InputFilter;
}): Record<string, any> {
  // Deep clone the resolved JSON — never mutate the parser's live internal object.
  const json: Record<string, any> = JSON.parse(JSON.stringify(document.json()));
  const isV3 = 'operations' in json && typeof json.operations === 'object';

  const retained = computeRetentionSets({document, filter});

  removeChannels({json, retained: retained.channelIds});
  if (isV3) {
    applyV3Surgery({json, retained});
  } else {
    applyV2Surgery({json, retained});
  }
  pruneOrphanSchemas(json);

  return json;
}
