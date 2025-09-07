/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext,
  TypeScriptChannelRenderedFunctionType
} from '../../types';
import {
  findNameFromOperation,
  findOperationId,
  findReplyId
} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {
  getFunctionTypeMappingFromAsyncAPI,
  shouldRenderFunctionType
} from '../../asyncapi';
import {renderCoreRequest} from './coreRequest';
import {renderCoreReply} from './coreReply';
import {renderCorePublish} from './corePublish';
import {renderCoreSubscribe} from './coreSubscribe';
import {renderJetstreamPullSubscribe} from './jetstreamPullSubscribe';
import {renderJetstreamPushSubscription} from './jetstreamPushSubscription';
import {renderJetstreamPublish} from './jetstreamPublish';
import {ChannelInterface, OperationInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {TypeScriptPayloadRenderType} from '../../../payloads';

export {
  renderCoreRequest,
  renderCoreReply,
  renderCorePublish,
  renderCoreSubscribe,
  renderJetstreamPullSubscribe,
  renderJetstreamPushSubscription,
  renderJetstreamPublish
};

export async function generateNatsChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {parameter, headers, topic, payloads} = context;
  const ignoreOperation = !context.generator.asyncapiGenerateForOperations;
  let natsTopic = topic.startsWith('/') ? topic.slice(1) : topic;
  natsTopic = natsTopic.replace(/\//g, '.');

  const natsContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: headers,
    topic: natsTopic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, natsContext)
      : await generateForChannels(context, channel, natsContext);

  addRendersToExternal(
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  );
}

function addRendersToExternal(
  renders: SingleFunctionRenderType[],
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[],
  parameter?: ConstrainedObjectModel
) {
  protocolCodeFunctions['nats'].push(...renders.map((value) => value.code));
  externalProtocolFunctionInformation['nats'].push(
    ...renders.map((value) => ({
      functionType: value.functionType,
      functionName: value.functionName,
      messageType: value.messageType,
      replyType: value.replyType,
      parameterType: parameter?.type
    }))
  );
  const renderedDependencies = renders
    .map((value) => value.dependencies)
    .flat(Infinity);
  dependencies.push(...(new Set(renderedDependencies) as any));
}

async function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  natsContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    if (
      updatedFunctionTypeMapping !== undefined &&
      !updatedFunctionTypeMapping?.some((f) =>
        [
          ChannelFunctionTypes.NATS_REQUEST,
          ChannelFunctionTypes.NATS_REPLY,
          ChannelFunctionTypes.NATS_PUBLISH,
          ChannelFunctionTypes.NATS_SUBSCRIBE,
          ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
          ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
          ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH
        ].includes(f)
      )
    ) {
      continue;
    }
    const payload =
      payloads.operationModels[findOperationId(operation, channel)];
    if (!payload) {
      throw new Error(
        `Could not find payload for operation in channel typescript generator for NATS`
      );
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for NATS`
      );
    }
    const updatedContext = {
      ...natsContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel)
    };

    renders.push(
      ...(await generateOperationRenders(
        operation,
        updatedContext,
        updatedFunctionTypeMapping,
        generator,
        payloads,
        channel
      ))
    );
  }
  return renders;
}

async function generateOperationRenders(
  operation: OperationInterface,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any,
  payloads: any,
  channel: ChannelInterface
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const reply = operation.reply();

  if (reply) {
    renders.push(
      ...(await handleReplyOperation(
        operation,
        reply,
        channel,
        natsContext,
        functionTypeMapping,
        generator,
        payloads
      ))
    );
  } else {
    renders.push(
      ...(await handleNonReplyOperation(
        operation,
        natsContext,
        functionTypeMapping,
        generator
      ))
    );
  }

  return renders;
}

async function handleReplyOperation(
  operation: OperationInterface,
  reply: any,
  channel: ChannelInterface,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any,
  payloads: TypeScriptPayloadRenderType
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const replyId = findReplyId(operation, reply, channel);
  const replyMessageModel = payloads.operationModels[replyId];
  if (!replyMessageModel) {
    return renders;
  }

  const {messageModule: replyMessageModule, messageType: replyMessageType} =
    getMessageTypeAndModule(replyMessageModel);

  if (replyMessageType === undefined) {
    throw new Error(
      `Could not find reply message type for channel typescript generator for NATS`
    );
  }
  if (
    shouldRenderFunctionType(
      functionTypeMapping,
      ChannelFunctionTypes.NATS_REQUEST,
      operation.action(),
      generator.asyncapiReverseOperations
    )
  ) {
    renders.push(
      renderCoreRequest({
        ...natsContext,
        requestMessageModule: natsContext.messageModule,
        requestMessageType: natsContext.messageType,
        replyMessageModule,
        replyMessageType,
        requestTopic: natsContext.topic,
        payloadGenerator: payloads
      })
    );
  } else if (
    shouldRenderFunctionType(
      functionTypeMapping,
      ChannelFunctionTypes.NATS_REPLY,
      operation.action(),
      generator.asyncapiReverseOperations
    )
  ) {
    renders.push(
      renderCoreReply({
        ...natsContext,
        requestMessageModule: replyMessageModule,
        requestMessageType: replyMessageType,
        replyMessageModule: natsContext.messageModule,
        replyMessageType: natsContext.messageType,
        requestTopic: natsContext.topic,
        payloadGenerator: payloads
      })
    );
  }
  return renders;
}

async function handleNonReplyOperation(
  operation: OperationInterface,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const action = operation.action();
  const renderChecks = [
    {check: ChannelFunctionTypes.NATS_PUBLISH, render: renderCorePublish},
    {check: ChannelFunctionTypes.NATS_SUBSCRIBE, render: renderCoreSubscribe},
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
      render: renderJetstreamPullSubscribe
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
      render: renderJetstreamPushSubscription
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
      render: renderJetstreamPublish
    }
  ];

  for (const {check, render} of renderChecks) {
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        check,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(render(natsContext));
    }
  }
  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  natsContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping =
    getFunctionTypeMappingFromAsyncAPI(channel) ??
    generator.functionTypeMapping[channel.id()];

  const payload = payloads.channelModels[channel.id()];
  if (!payload) {
    throw new Error(`Could not find payload for channel typescript generator`);
  }

  const {messageModule, messageType} = getMessageTypeAndModule(payload);
  if (messageType === undefined) {
    throw new Error(
      `Could not find message type for channel typescript generator for NATS`
    );
  }
  const updatedContext = {...natsContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.NATS_PUBLISH,
      render: renderCorePublish,
      action: 'send'
    },
    {
      check: ChannelFunctionTypes.NATS_SUBSCRIBE,
      render: renderCoreSubscribe,
      action: 'receive'
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
      render: renderJetstreamPullSubscribe,
      action: 'receive'
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
      render: renderJetstreamPushSubscription,
      action: 'receive'
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
      render: renderJetstreamPublish,
      action: 'send'
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
  return renders;
}
