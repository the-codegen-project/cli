/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {
  findNameFromOperation,
  findOperationId,
  getOperationMetadata
} from '../../../../../utils';
import {
  getMessageTypeAndModule,
  attachGroupingMetadata,
  addRendersToExternal
} from '../../utils';
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {renderPublish} from './publish';
import {renderSubscribe} from './subscribe';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {createMissingPayloadError} from '../../../../../errors';

export {renderPublish, renderSubscribe};

export async function generateKafkaChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {parameter, topic} = context;
  const ignoreOperation = !context.generator.asyncapiGenerateForOperations;
  let kafkaTopic = topic.startsWith('/') ? topic.slice(1) : topic;
  kafkaTopic = kafkaTopic.replace(/\//g, context.generator.kafkaTopicSeparator);

  const kafkaContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: context.headers, // Kafka supports headers
    topic: kafkaTopic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: context.payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, kafkaContext)
      : await generateForChannels(context, channel, kafkaContext);

  addRendersToExternal({
    protocol: 'kafka',
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  });
}

async function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  kafkaContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping?.[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const payloadId = findOperationId(operation, channel);
    const payload = payloads.operationModels[payloadId];
    if (!payload) {
      throw createMissingPayloadError({
        channelOrOperation: payloadId,
        protocol: 'Kafka'
      });
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for Kafka`
      );
    }
    // Extract operation metadata for JSDoc
    const {description, deprecated} = getOperationMetadata(operation);
    const updatedContext = {
      ...kafkaContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel),
      description,
      deprecated
    };

    const operationRenders = generateOperationRenders(
      operation,
      updatedContext,
      updatedFunctionTypeMapping,
      generator
    );
    attachGroupingMetadata({
      renders: operationRenders,
      operation,
      channel,
      topic: context.topic
    });
    renders.push(...operationRenders);
  }
  return renders;
}

function generateOperationRenders(
  operation: any,
  kafkaContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
  const action = operation.action();

  if (
    shouldRenderFunctionType(
      functionTypeMapping,
      ChannelFunctionTypes.KAFKA_PUBLISH,
      action,
      generator.asyncapiReverseOperations
    )
  ) {
    renders.push(renderPublish(kafkaContext));
  }
  if (
    shouldRenderFunctionType(
      functionTypeMapping,
      ChannelFunctionTypes.KAFKA_SUBSCRIBE,
      action,
      generator.asyncapiReverseOperations
    )
  ) {
    renders.push(renderSubscribe(kafkaContext));
  }

  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  kafkaContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping =
    getFunctionTypeMappingFromAsyncAPI(channel) ??
    generator.functionTypeMapping?.[channel.id()];

  const payload = payloads.channelModels[channel.id()];
  if (!payload) {
    throw createMissingPayloadError({
      channelOrOperation: channel.id(),
      protocol: 'Kafka'
    });
  }

  const {messageModule, messageType} = getMessageTypeAndModule(payload);
  if (messageType === undefined) {
    throw new Error(
      `Could not find message type for channel typescript generator for Kafka`
    );
  }
  const updatedContext = {...kafkaContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.KAFKA_PUBLISH,
      render: renderPublish,
      action: 'send'
    },
    {
      check: ChannelFunctionTypes.KAFKA_SUBSCRIBE,
      render: renderSubscribe,
      action: 'receive'
    }
  ];

  for (const {check, render, action} of renderChecks) {
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        check,
        action as any,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(render(updatedContext));
    }
  }
  attachGroupingMetadata({
    renders,
    channel,
    topic: context.topic
  });
  return renders;
}
