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

function buildNativeOperation({
  event,
  action
}: {
  event: ParsedEventCatalogEvent;
  action: Action;
}): OperationInfo {
  return {
    id: event.id,
    channelId: event.id,
    subName: pascalCase(event.id),
    action,
    deprecated: false,
    messages: [{id: event.id, payloadKey: event.id}],
    description: undefined
  };
}

function buildNativeChannel({
  event,
  action
}: {
  event: ParsedEventCatalogEvent;
  action: Action;
}): ChannelInfo {
  const messages: MessageRef[] = [{id: event.id, payloadKey: event.id}];
  return {
    id: event.id,
    address: event.id,
    subName: pascalCase(event.id),
    protocols: ALL_PROTOCOLS,
    hasParameters: false,
    operations: [buildNativeOperation({event, action})],
    messages
  };
}

function pushUnique({
  channels,
  seenIds,
  channel
}: {
  channels: ChannelInfo[];
  seenIds: Set<string>;
  channel: ChannelInfo;
}): void {
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
  const nativeChannelsById = new Map<string, ChannelInfo>();

  // Native events. An event id may appear in both `sends` and
  // `receives`; when it does we attach both a send and a receive
  // operation to the same channel so publish AND subscribe helpers are
  // generated (rather than dropping the second action).
  const addNativeOperation = ({
    event,
    action
  }: {
    event: ParsedEventCatalogEvent;
    action: Action;
  }): void => {
    const existing = nativeChannelsById.get(event.id);
    if (!existing) {
      const channel = buildNativeChannel({event, action});
      nativeChannelsById.set(event.id, channel);
      channels.push(channel);
      return;
    }
    if (!existing.operations.some((operation) => operation.action === action)) {
      existing.operations.push(buildNativeOperation({event, action}));
    }
  };

  for (const event of catalog.sends) {
    addNativeOperation({event, action: 'send'});
  }
  for (const event of catalog.receives) {
    addNativeOperation({event, action: 'receive'});
  }

  const seenIds = new Set<string>(nativeChannelsById.keys());

  if (catalog.asyncapi) {
    for (const channel of produceAsyncAPIChannelInput(catalog.asyncapi)
      .channels) {
      pushUnique({channels, seenIds, channel});
    }
  }
  if (catalog.openapi) {
    for (const channel of produceOpenAPIChannelInput(catalog.openapi)
      .channels) {
      pushUnique({channels, seenIds, channel});
    }
  }

  return {channels};
}
