/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable security/detect-object-injection */
import {
  RenderRegularParameters,
  renderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {findNameFromOperation, findOperationId} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {shouldRenderFunctionType, getFunctionTypeMappingFromAsyncAPI} from '../../asyncapi';
import { renderPublish } from './publish';
import { renderSubscribe } from './subscribe';

export {renderPublish};
export {renderSubscribe};

export async function generateKafkaChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: any,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<string, renderedFunctionType[]>,
  dependencies: string[]
) {
  const {generator, payloads, parameter, topic} = context;
  let functionTypeMapping = generator.functionTypeMapping[channel.id()];
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let kafkaTopic = topic;
  if (topic.startsWith('/')) {
    kafkaTopic = kafkaTopic.slice(1);
  }
  kafkaTopic = kafkaTopic.replace(/\//g, generator.kafkaTopicSeparator);
  let kafkaContext: RenderRegularParameters = {
    channelParameters: parameter,
    topic: kafkaTopic,
    subName: context.subName,
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
      kafkaContext = {
        ...kafkaContext,
        messageType,
        messageModule,
        subName: findNameFromOperation(operation, channel)
      };

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
    kafkaContext = {...kafkaContext, messageType, messageModule};
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.KAFKA_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderPublish(kafkaContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.KAFKA_SUBSCRIBE,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderSubscribe(kafkaContext));
    }
  }
  protocolCodeFunctions['kafka'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['kafka'].push(
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
