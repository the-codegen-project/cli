/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext,
  TypeScriptChannelRenderedFunctionType
} from '../../types';
import {ChannelInfo, OperationInfo} from '../../input';
import {getMessageTypeAndModule, shouldRenderFunctionType} from '../../utils';
import {renderCoreRequest} from './coreRequest';
import {renderCoreReply} from './coreReply';
import {renderCorePublish} from './corePublish';
import {renderCoreSubscribe} from './coreSubscribe';
import {renderJetstreamPullSubscribe} from './jetstreamPullSubscribe';
import {renderJetstreamPushSubscription} from './jetstreamPushSubscription';
import {renderJetstreamPublish} from './jetstreamPublish';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {TypeScriptPayloadRenderType} from '../../../payloads';
import {createMissingPayloadError} from '../../../../../errors';

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
  channel: ChannelInfo,
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

  const operations = channel.operations;
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
  channel: ChannelInfo,
  natsContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping?.[channel.id];

  for (const operation of channel.operations) {
    const updatedFunctionTypeMapping =
      operation.functionTypeMapping ?? functionTypeMapping;
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
    const payload = payloads.operationModels[operation.id];
    if (!payload) {
      throw createMissingPayloadError({
        channelOrOperation: operation.id,
        protocol: 'NATS'
      });
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
      subName: operation.subName,
      description: operation.description,
      deprecated: operation.deprecated
    };

    renders.push(
      ...(await generateOperationRenders(
        operation,
        updatedContext,
        updatedFunctionTypeMapping,
        generator,
        payloads
      ))
    );
  }
  return renders;
}

async function generateOperationRenders(
  operation: OperationInfo,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any,
  payloads: TypeScriptPayloadRenderType
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];

  if (operation.reply) {
    renders.push(
      ...(await handleReplyOperation(
        operation,
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
  operation: OperationInfo,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any,
  payloads: TypeScriptPayloadRenderType
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const reply = operation.reply!;
  const replyMessageModel = payloads.operationModels[reply.replyId];
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
      operation.action,
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
      operation.action,
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
  operation: OperationInfo,
  natsContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const action = operation.action;
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
  channel: ChannelInfo,
  natsContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping =
    channel.functionTypeMapping ?? generator.functionTypeMapping?.[channel.id];

  const payload = payloads.channelModels[channel.id];
  if (!payload) {
    throw createMissingPayloadError({
      channelOrOperation: channel.id,
      protocol: 'NATS'
    });
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
      action: 'send' as const
    },
    {
      check: ChannelFunctionTypes.NATS_SUBSCRIBE,
      render: renderCoreSubscribe,
      action: 'receive' as const
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
      render: renderJetstreamPullSubscribe,
      action: 'receive' as const
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
      render: renderJetstreamPushSubscription,
      action: 'receive' as const
    },
    {
      check: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
      render: renderJetstreamPublish,
      action: 'send' as const
    }
  ];

  for (const {check, render, action} of renderChecks) {
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        check,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(render(updatedContext));
    }
  }
  return renders;
}
