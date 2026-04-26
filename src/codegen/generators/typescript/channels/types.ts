import {z} from 'zod';
import {GenericCodegenContext} from '../../../types';
import {zodImportExtension} from '../../../utils';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptParameterRenderType} from '../parameters';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {SecuritySchemeOptions} from '../../../inputs/openapi/security';

// Re-export for convenience
export {SecuritySchemeOptions};

export enum ChannelFunctionTypes {
  NATS_JETSTREAM_PUBLISH = 'nats_jetstream_publish',
  NATS_JETSTREAM_PULL_SUBSCRIBE = 'nats_jetstream_pull_subscribe',
  NATS_JETSTREAM_PUSH_SUBSCRIBE = 'nats_jetstream_push_subscribe',
  NATS_SUBSCRIBE = 'nats_subscribe',
  NATS_PUBLISH = 'nats_publish',
  NATS_REQUEST = 'nats_request',
  NATS_REPLY = 'nats_reply',
  MQTT_PUBLISH = 'mqtt_publish',
  MQTT_SUBSCRIBE = 'mqtt_subscribe',
  KAFKA_PUBLISH = 'kafka_publish',
  KAFKA_SUBSCRIBE = 'kafka_subscribe',
  AMQP_QUEUE_PUBLISH = 'amqp_queue_publish',
  AMQP_QUEUE_SUBSCRIBE = 'amqp_queue_subscribe',
  AMQP_EXCHANGE_PUBLISH = 'amqp_exchange_publish',
  HTTP_CLIENT = 'http_client',
  EVENT_SOURCE_FETCH = 'event_source_fetch',
  EVENT_SOURCE_EXPRESS = 'event_source_express',
  WEBSOCKET_PUBLISH = 'websocket_publish',
  WEBSOCKET_SUBSCRIBE = 'websocket_subscribe',
  WEBSOCKET_REGISTER = 'websocket_register'
}

export const sendingFunctionTypes = [
  ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
  ChannelFunctionTypes.NATS_PUBLISH,
  ChannelFunctionTypes.NATS_REQUEST,
  ChannelFunctionTypes.MQTT_PUBLISH,
  ChannelFunctionTypes.KAFKA_PUBLISH,
  ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
  ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
  ChannelFunctionTypes.EVENT_SOURCE_EXPRESS,
  ChannelFunctionTypes.HTTP_CLIENT,
  ChannelFunctionTypes.WEBSOCKET_PUBLISH,
  ChannelFunctionTypes.WEBSOCKET_REGISTER
];

export const receivingFunctionTypes = [
  ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
  ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
  ChannelFunctionTypes.NATS_REPLY,
  ChannelFunctionTypes.NATS_SUBSCRIBE,
  ChannelFunctionTypes.MQTT_SUBSCRIBE,
  ChannelFunctionTypes.KAFKA_SUBSCRIBE,
  ChannelFunctionTypes.EVENT_SOURCE_FETCH,
  ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE,
  ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE
];

export const zodTypescriptChannelsGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('channels-typescript')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([
      'parameters-typescript',
      'payloads-typescript',
      'headers-typescript'
    ])
    .describe(
      'The list of other generator IDs that this generator depends on. The channels generator depends on the parameters, payloads, and headers generators by default. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  preset: z
    .literal('channels')
    .default('channels')
    .describe(
      'Generates protocol-specific publish/subscribe/request/reply functions for each channel or operation. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  outputPath: z
    .string()
    .default('src/__gen__/channels')
    .describe(
      'The directory path where the generated channel functions will be written. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  protocols: z
    .array(
      z.enum([
        'nats',
        'kafka',
        'mqtt',
        'amqp',
        'event_source',
        'http_client',
        'websocket'
      ])
    )
    .default([])
    .describe(
      'The protocols to generate channel functions for. Each protocol produces typed publish/subscribe/request/reply functions tailored to that messaging system. [Read more about supported protocols here](https://the-codegen-project.org/docs/getting-started/protocols)'
    ),
  parameterGeneratorId: z
    .string()
    .optional()
    .describe(
      'When multiple TypeScript parameter generators are configured, specify which one this channels generator should depend on. Defaults to "parameters-typescript". [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    )
    .default('parameters-typescript'),
  payloadGeneratorId: z
    .string()
    .optional()
    .describe(
      'When multiple TypeScript payload generators are configured, specify which one this channels generator should depend on. Defaults to "payloads-typescript". [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    )
    .default('payloads-typescript'),
  headerGeneratorId: z
    .string()
    .optional()
    .describe(
      'When multiple TypeScript header generators are configured, specify which one this channels generator should depend on. Defaults to "headers-typescript". [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    )
    .default('headers-typescript'),
  asyncapiReverseOperations: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'When true, AsyncAPI operations are generated with their action reversed (a "send" operation becomes "receive" and vice versa). Often used to generate the opposite side of an API for testing. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  asyncapiGenerateForOperations: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'When true (default), only the operations defined in the AsyncAPI document are generated and their declared action is enforced. When false, more generic channel functions are generated regardless of the operation action. [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  functionTypeMapping: z
    .record(z.array(z.nativeEnum(ChannelFunctionTypes)).optional())
    .optional()
    .default({})
    .describe(
      'Used with AsyncAPI input to map a channel ID to the specific channel function types that should be rendered for it (e.g. "nats_publish", "kafka_subscribe"). [Read more about the channels generator here](https://the-codegen-project.org/docs/generators/channels)'
    ),
  kafkaTopicSeparator: z
    .string()
    .optional()
    .default('.')
    .describe(
      'The separator used when converting AsyncAPI channel addresses into Kafka topic names. For example, with the default ".", an address like "my/resource/path" becomes "my.resource.path". [Read more about the Kafka protocol here](https://the-codegen-project.org/docs/protocols/kafka)'
    ),
  eventSourceDependency: z
    .string()
    .optional()
    .default('@microsoft/fetch-event-source')
    .describe(
      'The npm package used as the EventSource (Server-Sent Events) client implementation. Override this when you need a fork or alternative because @microsoft/fetch-event-source is out of date in some areas. [Read more about the EventSource protocol here](https://the-codegen-project.org/docs/protocols/eventsource)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  importExtension: zodImportExtension.describe(
    'File extension appended to relative import paths in generated channel code. Use ".ts" for moduleResolution: "node16"/"nodenext", ".js" for compiled ESM output, or "none" (default) for bundlers. Overrides the global importExtension. [Read more about import extensions here](https://the-codegen-project.org/docs/configurations)'
  )
});

export type TypeScriptChannelsGenerator = z.input<
  typeof zodTypescriptChannelsGenerator
>;
export type TypeScriptChannelsGeneratorInternal = z.infer<
  typeof zodTypescriptChannelsGenerator
>;

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGeneratorInternal =
  zodTypescriptChannelsGenerator.parse({});

export interface TypeScriptChannelsContext extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
  generator: TypeScriptChannelsGeneratorInternal;
}
export interface TypeScriptChannelsGeneratorContext
  extends TypeScriptChannelsContext {
  payloads: TypeScriptPayloadRenderType;
  parameter: ConstrainedObjectModel | undefined;
  headers: ConstrainedObjectModel | undefined;
  topic: string;
  subName: string;
}
export type TypeScriptChannelRenderedFunctionType = {
  functionType: ChannelFunctionTypes;
  functionName: string;
  messageType: string;
  replyType?: string;
  parameterType?: string;
};
export interface TypeScriptChannelRenderType {
  payloadRender: TypeScriptPayloadRenderType;
  parameterRender: TypeScriptParameterRenderType;
  generator: TypeScriptChannelsGeneratorInternal;
  /**
   * All the rendered functions based on type.
   */
  renderedFunctions: Record<string, TypeScriptChannelRenderedFunctionType[]>;
  /**
   * The generated index file content (imports and re-exports of protocol modules).
   */
  result: string;
  /**
   * The generated protocol file contents, keyed by protocol name.
   * E.g., { nats: "export function publish...", kafka: "export function produce..." }
   * Useful for testing/snapshot verification of generated protocol code.
   */
  protocolFiles: Record<string, string>;
  /**
   * Generated files with path and content.
   */
  files: import('../../../types').GeneratedFile[];
}

export interface RenderRegularParameters<T = any> {
  topic: string;
  messageType: string;
  messageModule?: string;
  channelParameters: ConstrainedObjectModel | undefined;
  channelHeaders: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
  payloadGenerator: TypeScriptPayloadRenderType;
  additionalProperties?: T;
  /** Operation description from API specification for JSDoc generation */
  description?: string;
  /** Whether the operation is marked as deprecated in the API specification */
  deprecated?: boolean;
}

export interface RenderRequestReplyParameters {
  requestTopic: string;
  requestMessageType: string;
  requestMessageModule: string | undefined;
  replyMessageType: string;
  replyMessageModule: string | undefined;
  channelParameters: ConstrainedObjectModel | undefined;
  channelHeaders: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
  payloadGenerator: TypeScriptPayloadRenderType;
  /** Operation description from API specification for JSDoc generation */
  description?: string;
  /** Whether the operation is marked as deprecated in the API specification */
  deprecated?: boolean;
}

export interface RenderHttpParameters {
  requestTopic: string;
  requestMessageType?: string;
  servers?: string[];
  requestMessageModule: string | undefined;
  replyMessageType: string;
  replyMessageModule: string | undefined;
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  /**
   * Whether the reply payload includes status code-based unmarshalling.
   * When true, use unmarshalByStatusCode(json, statusCode) instead of unmarshal(json).
   */
  includesStatusCodes?: boolean;
  /** Operation description from API specification for JSDoc generation */
  description?: string;
  /** Whether the operation is marked as deprecated in the API specification */
  deprecated?: boolean;
}

export type SupportedProtocols =
  | 'nats'
  | 'kafka'
  | 'mqtt'
  | 'amqp'
  | 'event_source'
  | 'http_client'
  | 'websocket';
