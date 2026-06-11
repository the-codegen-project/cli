/**
 * AsyncAPI producer for the TypeScript channels generator.
 *
 * Walks `AsyncAPIDocumentInterface` and emits a `ChannelGeneratorInput`:
 * one `ChannelInfo` per channel, with normalized operations, message
 * refs, and per-protocol typed config. Protocol generators consume the
 * result without touching the AsyncAPI parser API.
 *
 * Field origins:
 *   - `channel.id` / `channel.address`             ← `channel.id()`/`channel.address()`
 *   - `channel.subName`                            ← `findNameFromChannel(channel)`
 *   - `channel.functionTypeMapping`                ← `x-the-codegen-project` extension on channel
 *   - `channel.amqp.exchangeName`                  ← `channel.bindings().get('amqp')?.value()?.exchange?.name`
 *   - `channel.protocols`                          ← all configured protocols (no filtering today)
 *   - `operation.id`                               ← `findOperationId(operation, channel)`
 *   - `operation.subName`                          ← `findNameFromOperation(operation, channel)`
 *   - `operation.action`                           ← `operation.action()` (normalized to send|receive)
 *   - `operation.description` / `deprecated`       ← `getOperationMetadata(operation)`
 *   - `operation.functionTypeMapping`              ← `x-the-codegen-project` extension on operation
 *   - `operation.reply`                            ← `operation.reply()` + `findReplyId`
 *   - `operation.http.method`                      ← `operation.bindings().get('http')?.json()['method']`
 *   - `operation.statusCodes`                      ← message-level `x-modelina-status-codes` (if present)
 */
/* eslint-disable security/detect-object-injection */
import {
  AsyncAPIDocumentInterface,
  ChannelInterface,
  OperationInterface
} from '@asyncapi/parser';
import {
  findOperationId,
  findReplyId,
  findNameFromChannel,
  findNameFromOperation,
  getOperationMetadata
} from '../../../utils';
import {
  Action,
  ChannelInfo,
  ChannelGeneratorInput,
  HttpMethod,
  MessageRef,
  OperationInfo,
  ProtocolName
} from '../../../generators/typescript/channels/input';
import {ChannelFunctionTypes} from '../../../generators/typescript/channels/types';

/**
 * Protocols that any AsyncAPI channel may apply to. The user's
 * `generator.protocols` list filters the actual run; this list just
 * advertises that the AsyncAPI producer doesn't restrict by source-
 * format.
 */
const ALL_PROTOCOLS: ProtocolName[] = [
  'nats',
  'kafka',
  'mqtt',
  'amqp',
  'event_source',
  'http_client',
  'websocket'
];

/**
 * Read the `x-the-codegen-project.functionTypeMapping` extension from
 * either a channel or an operation. Returns `undefined` when the
 * extension is absent.
 */
function readFunctionTypeMapping(
  object: ChannelInterface | OperationInterface
): ChannelFunctionTypes[] | undefined {
  return (
    object.extensions().get('x-the-codegen-project')?.value()
      ?.functionTypeMapping ?? undefined
  );
}

/**
 * Normalize an AsyncAPI operation action verb. AsyncAPI v2 used
 * `subscribe`/`publish`; v3 uses `send`/`receive`. We collapse to the
 * v3 vocabulary because that's what `shouldRenderFunctionType`
 * already expects in the protocol generators.
 */
function normalizeAction(rawAction: string): Action {
  switch (rawAction) {
    case 'send':
    case 'subscribe':
      return 'send';
    case 'receive':
    case 'publish':
      return 'receive';
    default:
      // Default to send to match historic AsyncAPI v2 fallback.
      return 'send';
  }
}

/**
 * Read the HTTP method from an operation's `http` binding.
 */
function readHttpMethod(operation: OperationInterface): HttpMethod | undefined {
  const raw = operation.bindings().get('http')?.json()?.['method'];
  if (typeof raw !== 'string') {
    return undefined;
  }
  const upper = raw.toUpperCase();
  switch (upper) {
    case 'GET':
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
    case 'OPTIONS':
    case 'HEAD':
      return upper;
    default:
      return undefined;
  }
}

function buildOperationInfo(
  operation: OperationInterface,
  channel: ChannelInterface
): OperationInfo {
  const id = findOperationId(operation, channel);
  const subName = findNameFromOperation(operation, channel);
  const {description, deprecated} = getOperationMetadata(operation);

  const messages: MessageRef[] = operation
    .messages()
    .all()
    .map((message) => ({
      id: message.id() ?? message.name() ?? id,
      payloadKey: id
    }));

  let reply: OperationInfo['reply'];
  const operationReply = operation.reply();
  if (operationReply) {
    const replyId = findReplyId(operation, operationReply, channel);
    const replyMessages: MessageRef[] = operationReply
      .messages()
      .all()
      .map((message) => ({
        id: message.id() ?? message.name() ?? replyId,
        payloadKey: replyId
      }));
    reply = {
      channelId: operationReply.channel()?.id(),
      replyId,
      messages: replyMessages
    };
  }

  const http = readHttpMethod(operation);

  return {
    id,
    channelId: channel.id(),
    action: normalizeAction(operation.action()),
    subName,
    description,
    deprecated: deprecated === true,
    messages,
    reply,
    functionTypeMapping: readFunctionTypeMapping(operation),
    http: http ? {method: http} : undefined
  };
}

function buildChannelInfo(channel: ChannelInterface): ChannelInfo {
  const operations = channel
    .operations()
    .all()
    .map((operation) => buildOperationInfo(operation, channel));

  const messages: MessageRef[] = channel
    .messages()
    .all()
    .map((message) => ({
      id: message.id() ?? message.name() ?? channel.id(),
      payloadKey: channel.id()
    }));

  const exchangeName = channel.bindings().get('amqp')?.value()?.exchange?.name;

  return {
    id: channel.id(),
    address: channel.address() ?? '',
    subName: findNameFromChannel(channel),
    protocols: ALL_PROTOCOLS,
    hasParameters: channel.parameters().all().length > 0,
    functionTypeMapping: readFunctionTypeMapping(channel),
    operations,
    messages,
    amqp: exchangeName ? {exchangeName} : undefined
  };
}

export function produceAsyncAPIChannelInput(
  asyncapiDocument: AsyncAPIDocumentInterface
): ChannelGeneratorInput {
  // Match the pre-refactor filter exactly — channels without an
  // address or with no messages are skipped (legacy AsyncAPI walker
  // behavior).
  const channels = asyncapiDocument
    .allChannels()
    .all()
    .filter(
      (channel) => channel.address() && channel.messages().all().length > 0
    )
    .map(buildChannelInfo);

  return {channels};
}
