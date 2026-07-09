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
  getOperationMetadata
} from '../../../../../utils';
import {
  getMessageTypeAndModule,
  attachGroupingMetadata,
  addRendersToExternal
} from '../../utils';
import {
  getFunctionTypeMappingFromAsyncAPI,
  shouldRenderFunctionType
} from '../../asyncapi';
import {renderWebSocketPublish} from './publish';
import {renderWebSocketSubscribe} from './subscribe';
import {renderWebSocketRegister} from './register';
import {ChannelInterface, OperationInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {createMissingPayloadError} from '../../../../../errors';

export {
  renderWebSocketPublish,
  renderWebSocketSubscribe,
  renderWebSocketRegister
};

export async function generateWebSocketChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {parameter, topic, payloads} = context;
  const ignoreOperation = !context.generator.asyncapiGenerateForOperations;

  // Convert AsyncAPI topic format to WebSocket path format
  const websocketTopic = topic.startsWith('/') ? topic : `/${topic}`;
  // Keep the topic as is for WebSocket paths

  const websocketContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: undefined, // WebSocket doesn't use headers in the same way
    topic: websocketTopic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, websocketContext)
      : await generateForChannels(context, channel, websocketContext);

  addRendersToExternal({
    protocol: 'websocket',
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
  websocketContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping?.[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    if (
      updatedFunctionTypeMapping !== undefined &&
      !updatedFunctionTypeMapping?.some((f) =>
        [
          ChannelFunctionTypes.WEBSOCKET_PUBLISH,
          ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE,
          ChannelFunctionTypes.WEBSOCKET_REGISTER
        ].includes(f)
      )
    ) {
      continue;
    }
    const payload =
      payloads.operationModels[findOperationId(operation, channel)];
    if (!payload) {
      throw new Error(
        `Could not find payload for operation in channel typescript generator for WebSocket`
      );
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for WebSocket`
      );
    }
    // Extract operation metadata for JSDoc
    const {description, deprecated} = getOperationMetadata(operation);
    const updatedContext = {
      ...websocketContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel),
      description,
      deprecated
    };

    const operationRenders = await generateOperationRenders(
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

async function generateOperationRenders(
  operation: OperationInterface,
  websocketContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const action = operation.action();

  const renderChecks = [
    {
      check: ChannelFunctionTypes.WEBSOCKET_PUBLISH,
      render: renderWebSocketPublish
    },
    {
      check: ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE,
      render: renderWebSocketSubscribe
    },
    {
      check: ChannelFunctionTypes.WEBSOCKET_REGISTER,
      render: renderWebSocketRegister
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
      renders.push(render(websocketContext));
    }
  }
  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  websocketContext: RenderRegularParameters
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
      protocol: 'WebSocket'
    });
  }

  const {messageModule, messageType} = getMessageTypeAndModule(payload);
  if (messageType === undefined) {
    throw new Error(
      `Could not find message type for channel typescript generator for WebSocket`
    );
  }
  const updatedContext = {...websocketContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.WEBSOCKET_PUBLISH,
      render: renderWebSocketPublish,
      action: 'send'
    },
    {
      check: ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE,
      render: renderWebSocketSubscribe,
      action: 'receive'
    },
    {
      check: ChannelFunctionTypes.WEBSOCKET_REGISTER,
      render: renderWebSocketRegister,
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
  attachGroupingMetadata({
    renders,
    channel,
    topic: context.topic
  });
  return renders;
}
