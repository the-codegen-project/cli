import {z} from 'zod';
import {GenericCodegenContext} from '../../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptParameterRenderType} from '../parameters';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export enum ChannelFunctionTypes {
  NATS_JETSTREAM_PUBLISH = 'nats_jetstream_publish',
  NATS_JETSTREAM_PULL_SUBSCRIBE = 'nats_jetstream_pull_subscribe',
  NATS_JETSTREAM_PUSH_SUBSCRIBE = 'nats_jetstream_push_subscribe',
  NATS_SUBSCRIBE = 'nats_subscribe',
  NATS_PUBLISH = 'nats_publish',
  NATS_REQUEST = 'nats_request',
  NATS_REPLY = 'nats_reply',
  MQTT_PUBLISH = 'mqtt_publish',
  KAFKA_PUBLISH = 'kafka_publish',
  KAFKA_SUBSCRIBE = 'kafka_subscribe',
  AMQP_QUEUE_PUBLISH = 'amqp_queue_publish',
  AMQP_EXCHANGE_PUBLISH = 'amqp_exchange_publish',
  EVENT_SOURCE_FETCH = 'event_source_fetch',
  EVENT_SOURCE_EXPRESS = 'event_source_express'
}

export const zodTypescriptChannelsGenerator = z.object({
  id: z.string().optional().default('channels-typescript'),
  dependencies: z
    .array(z.string())
    .optional()
    .default(['parameters-typescript', 'payloads-typescript'])
    .describe('The list of other generator IDs that this generator depends on'),
  preset: z.literal('channels').default('channels'),
  outputPath: z
    .string()
    .default('src/__gen__/channels')
    .describe('The path for which the generated channels will be saved'),
  protocols: z
    .array(z.enum(['nats', 'kafka', 'mqtt', 'amqp', 'event_source']))
    .default([])
    .describe('Select which protocol to generate the channel code for'),
  parameterGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript parameter generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('parameters-typescript'),
  payloadGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript payload generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('payloads-typescript'),
  asyncapiReverseOperations: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Setting this to true generate operations with reversed meaning. So for AsyncAPI this means if an operation is defined as action: "send", it gets the opposite view of "receive".'
    ),
  asyncapiGenerateForOperations: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Setting this to false means we dont enforce the operations defined in the AsyncAPI document and generate more generic channels.'
    ),
  functionTypeMapping: z
    .record(z.array(z.nativeEnum(ChannelFunctionTypes)).optional())
    .optional()
    .default({})
    .describe(
      'Used in conjunction with AsyncAPI input, can define channel ID along side the type of functions that should be rendered.'
    ),
  kafkaTopicSeparator: z
    .string()
    .optional()
    .default('.')
    .describe(
      'Used with AsyncAPI to ensure the right character separate topics, example if address is my/resource/path it will be converted to my.resource.path'
    ),
  eventSourceDependency: z
    .string()
    .optional()
    .default('@microsoft/fetch-event-source')
    .describe(
      'Change the fork/dependency instead of @microsoft/fetch-event-source as it is out of date in some areas'
    ),
  language: z.literal('typescript').optional().default('typescript')
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
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptChannelsGeneratorInternal;
}
export interface TypeScriptChannelsGeneratorContext extends TypeScriptChannelsContext {
  payloads: TypeScriptPayloadRenderType;
  parameter: ConstrainedObjectModel | undefined;
  topic: string;
  subName: string;
}
export type renderedFunctionType = {
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
  renderedFunctions: Record<string, renderedFunctionType[]>;
  result: string;
}

export interface RenderRegularParameters<T = any> {
  topic: string;
  messageType: string;
  messageModule?: string;
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
  additionalProperties?: T;
}

export interface RenderRequestReplyParameters {
  requestTopic: string;
  requestMessageType: string;
  requestMessageModule: string | undefined;
  replyMessageType: string;
  replyMessageModule: string | undefined;
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
}

export type SupportedProtocols =
  | 'nats'
  | 'kafka'
  | 'mqtt'
  | 'amqp'
  | 'event_source';
