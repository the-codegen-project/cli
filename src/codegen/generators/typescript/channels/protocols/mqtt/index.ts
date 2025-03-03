/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  renderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {findNameFromOperation, findOperationId} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {renderPublish} from './publish';
import {shouldRenderFunctionType, getFunctionTypeMappingFromAsyncAPI} from '../../asyncapi';
import { ChannelInterface } from '@asyncapi/parser';

export {renderPublish};

export async function generateMqttChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<string, renderedFunctionType[]>,
  dependencies: string[]
) {
  const {generator, payloads, parameter, topic} = context;
  let functionTypeMapping = generator.functionTypeMapping[channel.id()];
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let mqttContext: RenderRegularParameters = {
    channelParameters: parameter,
    topic,
    messageType: ''
  };
  const renders = [];
  const operations = channel.operations().all();
  if (operations.length > 0 && !ignoreOperation) {
    for (const operation of operations) {
      functionTypeMapping = getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
      const payloadId = findOperationId(operation, channel);
      const payload = payloads.operationModels[payloadId];
      if (payload === undefined) {
        throw new Error(
          `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
        );
      }
      const {messageModule, messageType} = getMessageTypeAndModule(payload);
      mqttContext = {
        ...mqttContext,
        messageType,
        messageModule,
        subName: findNameFromOperation(operation, channel)
      };

      const action = operation.action();
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.MQTT_PUBLISH,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(renderPublish(mqttContext));
      }
    }
  } else {
    functionTypeMapping = getFunctionTypeMappingFromAsyncAPI(channel) ?? functionTypeMapping;
    const payload = payloads.channelModels[channel.id()];
    if (payload === undefined) {
      throw new Error(
        `Could not find payload for ${channel.id()} for channel typescript generator`
      );
    }
    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    mqttContext = {...mqttContext, messageType, messageModule};
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.MQTT_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderPublish(mqttContext));
    }
  }
  protocolCodeFunctions['mqtt'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['mqtt'].push(
    ...renders.map((value) => {
      return {
        functionType: value.functionType,
        functionName: value.functionName,
        messageType: value.messageType,
        replyType: value.replyType,
        parameterType: parameter?.type
      } as renderedFunctionType;
    })
  );
  const renderedDependencies = renders
    .map((value) => value.dependencies)
    .flat(Infinity);
  dependencies.push(...(new Set(renderedDependencies) as any));
}
