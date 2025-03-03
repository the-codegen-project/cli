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
import { renderExpress } from './express';
import { renderFetch } from './fetch';

export {renderFetch};
export {renderExpress};

export async function generateEventSourceChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: any,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<string, renderedFunctionType[]>,
  dependencies: string[]
) {
  const {generator, payloads, parameter, topic} = context;
  let functionTypeMapping = generator.functionTypeMapping[channel.id()];
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let eventSourceContext: RenderRegularParameters = {
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
      eventSourceContext = {
        ...eventSourceContext,
        messageType,
        messageModule,
        subName: findNameFromOperation(operation, channel)
      };

      const action = operation.action();
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.EVENT_SOURCE_FETCH,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(
          renderFetch({
            ...eventSourceContext,
            additionalProperties: {
              fetchDependency: context.generator.eventSourceDependency
            }
          })
        );
      }
      if (
        shouldRenderFunctionType(
          functionTypeMapping,
          ChannelFunctionTypes.EVENT_SOURCE_EXPRESS,
          action,
          generator.asyncapiReverseOperations
        )
      ) {
        renders.push(renderExpress(eventSourceContext));
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
    eventSourceContext = {...eventSourceContext, messageType, messageModule};
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.EVENT_SOURCE_FETCH,
        'receive',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(
        renderFetch({
          ...eventSourceContext,
          additionalProperties: {
            fetchDependency: context.generator.eventSourceDependency
          }
        })
      );
    }
    if (
      shouldRenderFunctionType(
        functionTypeMapping,
        ChannelFunctionTypes.EVENT_SOURCE_EXPRESS,
        'send',
        generator.asyncapiReverseOperations
      )
    ) {
      renders.push(renderExpress(eventSourceContext));
    }
  }
  protocolCodeFunctions['event_source'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['event_source'].push(
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
