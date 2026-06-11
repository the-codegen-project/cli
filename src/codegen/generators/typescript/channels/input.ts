/**
 * Input contract for the TypeScript channels generator.
 *
 * Channel/operation/protocol info is fully normalized here: protocol
 * generators consume `ChannelInfo` and `OperationInfo` field-by-field
 * and never reach back into `@asyncapi/parser` types. Per-protocol
 * configuration that used to live in source-format bindings (AsyncAPI
 * `channel.bindings`, `operation.bindings`) is surfaced as typed
 * per-protocol slots — the producer extracts whatever the generator
 * needs and drops it on the appropriate field.
 *
 * If a generator needs another binding-derived value, the producer
 * adds a new typed field. Bindings are never passed through opaquely.
 */
import {ChannelFunctionTypes} from './types';

/**
 * Protocols supported by the channels generator. Mirrors the values of
 * the `protocols` configuration option on `TypeScriptChannelsGenerator`.
 */
export type ProtocolName =
  | 'nats'
  | 'kafka'
  | 'mqtt'
  | 'amqp'
  | 'event_source'
  | 'http_client'
  | 'websocket';

/**
 * Operation action — what the operation does relative to the channel.
 * Producers normalize the source document's verb (`send`/`receive` in
 * AsyncAPI v3, `subscribe`/`publish` in v2, request/response method
 * in OpenAPI) into this two-value vocabulary.
 */
export type Action = 'send' | 'receive';

/**
 * HTTP methods used by the HTTP protocol generator.
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

/**
 * Reference to a message used to look up its payload model in
 * `PayloadGeneratorInput`. The producer is responsible for determining
 * which payload key applies (operation id vs channel id vs reply id);
 * the generator only consults the lookup keys.
 */
export interface MessageRef {
  /** Logical id of the message. */
  id: string;
  /**
   * Lookup key in the payload input's `operationPayloads` /
   * `channelPayloads`. May coincide with `id` or be derived from
   * `findOperationId` / `findReplyId` semantics.
   */
  payloadKey: string;
}

/**
 * Reply description for a request/reply operation pair.
 */
export interface OperationReplyInfo {
  /** Channel id of the reply (may equal the request channel). */
  channelId?: string;
  /** Lookup key for the reply payload in `operationPayloads`. */
  replyId: string;
  /** Reply message refs. */
  messages: MessageRef[];
}

/**
 * AMQP-specific per-channel configuration. Producers populate this
 * when the channel applies to AMQP and the source format provides the
 * data (AsyncAPI `channel.bindings.amqp.exchange.name`).
 */
export interface AmqpChannelConfig {
  /** Exchange name from `amqp.exchange.name`, when declared. */
  exchangeName?: string;
}

/**
 * HTTP-specific per-operation configuration.
 */
export interface HttpOperationConfig {
  /** HTTP method for this operation. */
  method: HttpMethod;
}

/**
 * Normalized operation data: what the channels generator and protocol
 * generators need to render a single send/receive/request/reply.
 */
export interface OperationInfo {
  /** Stable id of this operation (used for payload/header lookups). */
  id: string;
  /** Channel id this operation belongs to. */
  channelId: string;
  /**
   * PascalCase name used as the prefix on generated function names
   * (e.g. `subscribeToMyEvent`). Pre-refactor: `findNameFromOperation`.
   */
  subName: string;
  /** What this operation does relative to the channel. */
  action: Action;
  /** Operation description for JSDoc on generated functions. */
  description?: string;
  /** Whether the operation is marked deprecated in the source spec. */
  deprecated: boolean;
  /** Messages associated with this operation. */
  messages: MessageRef[];
  /** Reply info, when this is a request/reply operation. */
  reply?: OperationReplyInfo;
  /**
   * Per-operation override of which channel-function types to render.
   * Mirrors the `x-the-codegen-project` extension on AsyncAPI operations.
   */
  functionTypeMapping?: ChannelFunctionTypes[];
  /**
   * Status codes typed as a discriminator for status-code-based
   * unmarshalling. Replaces direct reads of the `x-modelina-status-codes`
   * extension at the generator layer.
   */
  statusCodes?: number[];
  /** HTTP configuration when this operation participates in `http_client`. */
  http?: HttpOperationConfig;
}

/**
 * Normalized channel data consumed by the channels generator and its
 * protocol sub-generators.
 */
export interface ChannelInfo {
  /** Stable id of this channel. */
  id: string;
  /** Channel address (subject/topic/path) used for routing. */
  address: string;
  /**
   * PascalCase name used as the prefix on generated function names
   * for channel-level (no operations) renders. Pre-refactor:
   * `findNameFromChannel`.
   */
  subName: string;
  /**
   * Protocols that apply to this channel. Producers resolve this from
   * AsyncAPI server bindings + extensions, or hard-code it for
   * source formats that bind to a single protocol (OpenAPI →
   * `['http_client']`).
   */
  protocols: ProtocolName[];
  /** True iff the channel declares parameters. */
  hasParameters: boolean;
  /**
   * Channel-level override of which function types to render
   * (mirrors `x-the-codegen-project` on the channel itself).
   */
  functionTypeMapping?: ChannelFunctionTypes[];
  /** Operations defined on this channel. */
  operations: OperationInfo[];
  /**
   * Channel-level messages — used when no operations exist (AsyncAPI v2
   * channel.messages() flow). The generator falls back to these when
   * `operations` is empty or `asyncapiGenerateForOperations` is false.
   */
  messages: MessageRef[];
  /** AMQP-specific config; present iff this channel applies to AMQP. */
  amqp?: AmqpChannelConfig;
}

/**
 * The full channels-generator input. The producer walks the source
 * document and emits one `ChannelInfo` per channel; the generator
 * iterates and dispatches by `channel.protocols`.
 */
export interface ChannelGeneratorInput {
  channels: ChannelInfo[];
}
