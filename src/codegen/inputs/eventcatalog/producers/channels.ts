/**
 * EventCatalog producer for the TypeScript channels generator.
 *
 * Composes:
 *   - AsyncAPI channel walker (when service declares an asyncapiPath)
 *   - OpenAPI channel walker (when service declares an openapiPath)
 *   - Native channel synthesis (one channel per event in
 *     `sends`/`receives`, message refs included for payload lookup)
 *
 * Native events are emitted with `protocols: [all known]` so the
 * channels walker can dispatch to whichever protocols the user
 * configures (matches the AsyncAPI default).
 */
import {
  Action,
  ChannelInfo,
  ChannelGeneratorInput,
  MessageRef,
  OperationInfo,
  ProtocolName
} from '../../../generators/typescript/channels/input';
import {ParsedEventCatalog, ParsedEventCatalogEvent} from '../parsedCatalog';
import {produceAsyncAPIChannelInput} from '../../asyncapi/producers/channels';
import {produceOpenAPIChannelInput} from '../../openapi/producers/channels';
import {pascalCase} from '../../../generators/typescript/utils';

const ALL_PROTOCOLS: ProtocolName[] = [
  'nats',
  'kafka',
  'mqtt',
  'amqp',
  'event_source',
  'http_client',
  'websocket'
];

function buildNativeChannel(
  event: ParsedEventCatalogEvent,
  action: Action
): ChannelInfo {
  const subName = pascalCase(event.id);
  const messages: MessageRef[] = [{id: event.id, payloadKey: event.id}];
  const operation: OperationInfo = {
    id: event.id,
    channelId: event.id,
    subName,
    action,
    deprecated: false,
    messages,
    description: undefined
  };
  return {
    id: event.id,
    address: event.id,
    subName,
    protocols: ALL_PROTOCOLS,
    hasParameters: false,
    operations: [operation],
    messages
  };
}

function pushUnique(
  channels: ChannelInfo[],
  seenIds: Set<string>,
  channel: ChannelInfo
): void {
  if (seenIds.has(channel.id)) {
    return;
  }
  seenIds.add(channel.id);
  channels.push(channel);
}

export function produceEventCatalogChannelInput(
  catalog: ParsedEventCatalog
): ChannelGeneratorInput {
  const channels: ChannelInfo[] = [];
  const seenIds = new Set<string>();

  // Native events. A given event id may appear in both sends and
  // receives, in which case the first action wins (sends iterates
  // first). Producers are non-destructive on conflicts to keep the
  // output deterministic.
  for (const event of catalog.sends) {
    pushUnique(channels, seenIds, buildNativeChannel(event, 'send'));
  }
  for (const event of catalog.receives) {
    pushUnique(channels, seenIds, buildNativeChannel(event, 'receive'));
  }

  if (catalog.asyncapi) {
    for (const channel of produceAsyncAPIChannelInput(catalog.asyncapi)
      .channels) {
      pushUnique(channels, seenIds, channel);
    }
  }
  if (catalog.openapi) {
    for (const channel of produceOpenAPIChannelInput(catalog.openapi)
      .channels) {
      pushUnique(channels, seenIds, channel);
    }
  }

  return {channels};
}
