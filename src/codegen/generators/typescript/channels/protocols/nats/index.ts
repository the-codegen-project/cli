/* eslint-disable security/detect-object-injection */
import { RenderRegularParameters, renderedFunctionType, ChannelFunctionTypes, TypeScriptChannelsGeneratorContext} from '../../types';
import {findNameFromOperation, findOperationId, findReplyId} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import { getFunctionTypeMappingFromAsyncAPI, shouldRenderFunctionType } from '../../asyncapi';
import { renderCoreRequest } from './coreRequest';
import { renderCoreReply } from './coreReply';
import { renderCorePublish } from './corePublish';
import { renderCoreSubscribe } from './coreSubscribe';
import { renderJetstreamPullSubscribe } from './jetstreamPullSubscribe';
import { renderJetstreamPushSubscription } from './jetstreamPushSubscription';
import { renderJetstreamPublish } from './jetstreamPublish';

export {renderCoreRequest};
export {renderCoreReply};
export {renderCorePublish};
export {renderCoreSubscribe};
export {renderJetstreamPullSubscribe};
export {renderJetstreamPushSubscription};
export {renderJetstreamPublish};

export async function generateNatsChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: any,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<string, renderedFunctionType[]>,
  dependencies: string[]
) {
  const {generator, payloads, parameter, topic} = context;
  let functionTypeMapping = generator.functionTypeMapping[channel.id()];
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let natsTopic = topic;
  if (natsTopic.startsWith('/')) {
    natsTopic = natsTopic.slice(1);
  }
  natsTopic = natsTopic.replace(/\//g, '.');
  let natsContext: RenderRegularParameters = {
    channelParameters: parameter,
    topic: natsTopic,
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
      const {messageModule, messageType} =
        getMessageTypeAndModule(payload);
      natsContext = {
        ...natsContext,
        messageType,
        messageModule,
        subName: findNameFromOperation(operation, channel)
      };

      const reply = operation.reply();
      if (reply) {
        const replyId = findReplyId(operation, reply, channel);
        const replyMessageModel = payloads.operationModels[replyId];
        if (!replyMessageModel) {
          continue;
        }
        const {
          messageModule: replyMessageModule,
          messageType: replyMessageType
        } = getMessageTypeAndModule(replyMessageModel);
        const shouldRenderReply = shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.NATS_REPLY,
          operation.action(),
          generator.asyncapiReverseOperations
        );
        const shouldRenderRequest = shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.NATS_REQUEST,
          operation.action(),
          generator.asyncapiReverseOperations
        );
        if (shouldRenderRequest) {
          renders.push(
            renderCoreRequest({
              subName: findNameFromOperation(operation, channel),
              requestMessageModule: messageModule,
              requestMessageType: messageType,
              replyMessageModule,
              replyMessageType,
              requestTopic: topic,
              channelParameters: parameter
            })
          );
        } else if (shouldRenderReply) {
          renders.push(
            renderCoreReply({
              subName: findNameFromOperation(operation, channel),
              requestMessageModule: replyMessageModule,
              requestMessageType: replyMessageType,
              replyMessageModule: messageModule,
              replyMessageType: messageType,
              requestTopic: topic,
              channelParameters: parameter
            })
          );
        }
      } else {
        const action = operation.action();
        if (
          shouldRenderFunctionType(
            functionTypeMapping,
            ChannelFunctionTypes.NATS_PUBLISH,
            action,
            generator.asyncapiReverseOperations
          )
        ) {
          renders.push(renderCorePublish(natsContext));
        }
        if (
          shouldRenderFunctionType(
            functionTypeMapping,
            ChannelFunctionTypes.NATS_SUBSCRIBE,
            action,
            generator.asyncapiReverseOperations
          )
        ) {
          renders.push(renderCoreSubscribe(natsContext));
        }
        if (
          shouldRenderFunctionType(
            functionTypeMapping,
            ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
            action,
            generator.asyncapiReverseOperations
          )
        ) {
          renders.push(renderJetstreamPullSubscribe(natsContext));
        }
        if (
          shouldRenderFunctionType(
            functionTypeMapping,
            ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
            action,
            generator.asyncapiReverseOperations
          )
        ) {
          renders.push(renderJetstreamPushSubscription(natsContext));
        }
        if (
          shouldRenderFunctionType(
            functionTypeMapping,
            ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
            action,
            generator.asyncapiReverseOperations
          )
        ) {
          renders.push(renderJetstreamPublish(natsContext));
        }
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
    const {messageModule, messageType} =
      getMessageTypeAndModule(payload);
    natsContext = {...natsContext, messageType, messageModule};
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.NATS_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderCorePublish(natsContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.NATS_SUBSCRIBE,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderCoreSubscribe(natsContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderJetstreamPullSubscribe(natsContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderJetstreamPushSubscription(natsContext));
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderJetstreamPublish(natsContext));
    }
  }
  protocolCodeFunctions['nats'].push(
    ...renders.map((value) => value.code)
  );

  externalProtocolFunctionInformation['nats'].push(
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
