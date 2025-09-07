/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {findNameFromOperation, findOperationId} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {renderPublish} from './publish';
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export {renderPublish};

export async function generateMqttChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {generator, parameter, topic} = context;
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  const mqttContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: context.headers, // MQTT v5 supports user properties as headers
    topic,
    subName: context.subName,
    messageType: '',
    payloadGenerator: context.payloads
  };
  let renders = [];
  const operations = channel.operations().all();
  if (operations.length > 0 && !ignoreOperation) {
    renders = generateForOperations(context, channel, mqttContext);
  } else {
    renders = generateForChannels(context, channel, mqttContext);
  }
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
  protocolCodeFunctions['mqtt'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['mqtt'].push(
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

function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  mqttContext: RenderRegularParameters
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const payloadId = findOperationId(operation, channel);
    const payload = payloads.operationModels[payloadId];
    if (payload === undefined) {
      throw new Error(
        `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
      );
    }
    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for ${payloadId} for mqtt channel typescript generator`
      );
    }
    const updatedContext = {
      ...mqttContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel)
    };

    const action = operation.action();
    if (
      shouldRenderFunctionType(
        updatedFunctionTypeMapping,
        ChannelFunctionTypes.MQTT_PUBLISH,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderPublish(updatedContext));
    }
  }
  return renders;
}

function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  mqttContext: RenderRegularParameters
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  const updatedFunctionTypeMapping =
    getFunctionTypeMappingFromAsyncAPI(channel) ?? functionTypeMapping;
  const payload = payloads.channelModels[channel.id()];
  if (payload === undefined) {
    throw new Error(
      `Could not find payload for ${channel.id()} for mqtt channel typescript generator`
    );
  }
  const {messageModule, messageType} = getMessageTypeAndModule(payload);
  if (messageType === undefined) {
    throw new Error(
      `Could not find message type for ${channel.id()} for mqtt channel typescript generator`
    );
  }
  const updatedContext = {...mqttContext, messageType, messageModule};
  if (
    shouldRenderFunctionType(
      updatedFunctionTypeMapping,
      ChannelFunctionTypes.MQTT_PUBLISH,
      'send',
      generator.asyncapiReverseOperations
    )
  ) {
    renders.push(renderPublish(updatedContext));
  }
  return renders;
}
