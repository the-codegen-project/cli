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
import { renderPublishExchange } from './publishExchange';
import { renderPublishQueue } from './publishQueue';
import { renderSubscribeQueue } from './subscribeQueue';

export {renderPublishExchange};
export {renderPublishQueue};
export {renderSubscribeQueue};

export async function generateAmqpChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: any,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<string, renderedFunctionType[]>,
  dependencies: string[]
) {
  const {generator, payloads, parameter, topic} = context;
  let functionTypeMapping = generator.functionTypeMapping[channel.id()];
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let amqpContext: RenderRegularParameters = {
    channelParameters: parameter,
    topic,
    messageType: '',
    subName: context.subName
  };
  const renders = [];
  const operations = channel.operations().all();
  const exchangeName =
    channel.bindings().get('amqp')?.value()?.exchange?.name ?? undefined;
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
      amqpContext = {
        ...amqpContext,
        messageType,
        messageModule,
        subName: findNameFromOperation(operation, channel)
      };

      const action = operation.action();
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(
          renderPublishExchange({
            ...amqpContext,
            additionalProperties: {exchange: exchangeName}
          })
        );
      }
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(renderPublishQueue(amqpContext));
      }
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(renderSubscribeQueue(amqpContext));
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
    amqpContext = {...amqpContext, messageType, messageModule};
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(
        renderPublishExchange({
          ...amqpContext,
          additionalProperties: {exchange: exchangeName}
        })
      );
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderPublishQueue(amqpContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderSubscribeQueue(amqpContext));
    }
  }
  protocolCodeFunctions['amqp'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['amqp'].push(
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
