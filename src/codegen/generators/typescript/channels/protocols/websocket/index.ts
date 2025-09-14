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
  findOperationId
} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {
  getFunctionTypeMappingFromAsyncAPI,
  shouldRenderFunctionType
} from '../../asyncapi';
import {renderWebSocketPublish} from './publish';
import {renderWebSocketSubscribe} from './subscribe';
import {renderWebSocketRegister} from './register';
import {ChannelInterface, OperationInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

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
  protocolCodeFunctions['websocket'].push(...renders.map((value) => value.code));
  externalProtocolFunctionInformation['websocket'].push(
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
  websocketContext: RenderRegularParameters
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
    const updatedContext = {
      ...websocketContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel)
    };

    renders.push(
      ...(await generateOperationRenders(
        operation,
        updatedContext,
        updatedFunctionTypeMapping,
        generator
      ))
    );
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
    {check: ChannelFunctionTypes.WEBSOCKET_PUBLISH, render: renderWebSocketPublish},
    {check: ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE, render: renderWebSocketSubscribe},
    {check: ChannelFunctionTypes.WEBSOCKET_REGISTER, render: renderWebSocketRegister}
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
    generator.functionTypeMapping[channel.id()];

  const payload = payloads.channelModels[channel.id()];
  if (!payload) {
    throw new Error(`Could not find payload for channel typescript generator`);
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
  return renders;
}
