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
import {renderPublishExchange} from './publishExchange';
import {renderPublishQueue} from './publishQueue';
import {renderSubscribeQueue} from './subscribeQueue';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {createMissingPayloadError} from '../../../../../errors';

export {renderPublishExchange, renderPublishQueue, renderSubscribeQueue};

export async function generateAmqpChannels(
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

  const amqpContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: context.headers, // AMQP supports message properties as headers
    topic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: context.payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, amqpContext)
      : await generateForChannels(context, channel, amqpContext);

  addRendersToExternal({
    protocol: 'amqp',
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
  amqpContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping?.[channel.id()];
  const exchangeName = channel.bindings().get('amqp')?.value()?.exchange?.name;

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const payloadId = findOperationId(operation, channel);
    const payload = payloads.operationModels[payloadId];
    if (!payload) {
      throw createMissingPayloadError({
        channelOrOperation: payloadId,
        protocol: 'AMQP'
      });
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for AMQP`
      );
    }
    // Extract operation metadata for JSDoc
    const {description, deprecated} = getOperationMetadata(operation);
    const updatedContext = {
      ...amqpContext,
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
      generator,
      exchangeName
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
  amqpContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any,
  exchangeName?: string
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
  const action = operation.action();

  const renderChecks = [
    {
      check: ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
      render: renderPublishExchange,
      additionalProperties: {exchange: exchangeName}
    },
    {
      check: ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
      render: renderPublishQueue
    },
    {
      check: ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE,
      render: renderSubscribeQueue
    }
  ];

  for (const {check, render, additionalProperties} of renderChecks) {
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        check,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(render({...amqpContext, additionalProperties}));
    }
  }

  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  amqpContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping =
    getFunctionTypeMappingFromAsyncAPI(channel) ??
    generator.functionTypeMapping?.[channel.id()];
  const exchangeName = channel.bindings().get('amqp')?.value()?.exchange?.name;

  const payload = payloads.channelModels[channel.id()];
  if (!payload) {
    throw createMissingPayloadError({
      channelOrOperation: channel.id(),
      protocol: 'AMQP'
    });
  }

  const {messageModule, messageType} = getMessageTypeAndModule(payload);
  if (messageType === undefined) {
    throw new Error(
      `Could not find message type for channel typescript generator for AMQP`
    );
  }
  const updatedContext = {...amqpContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
      render: renderPublishExchange,
      action: 'send',
      additionalProperties: {exchange: exchangeName}
    },
    {
      check: ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
      render: renderPublishQueue,
      action: 'send'
    },
    {
      check: ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE,
      render: renderSubscribeQueue,
      action: 'receive'
    }
  ];

  for (const {check, render, action, additionalProperties} of renderChecks) {
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        check,
        action as any,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(render({...updatedContext, additionalProperties}));
    }
  }
  attachGroupingMetadata({
    renders,
    channel,
    topic: context.topic
  });
  return renders;
}
