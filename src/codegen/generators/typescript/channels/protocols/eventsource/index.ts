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
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {renderExpress} from './express';
import {renderFetch} from './fetch';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export {renderFetch, renderExpress};

export async function generateEventSourceChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {parameter, topic} = context;
  const ignoreOperation = !context.generator.asyncapiGenerateForOperations;

  const eventSourceContext: RenderRegularParameters = {
    channelParameters: parameter,
    channelHeaders: context.headers, // EventSource supports custom headers
    topic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: context.payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, eventSourceContext)
      : await generateForChannels(context, channel, eventSourceContext);

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
  protocolCodeFunctions['event_source'].push(
    ...renders.map((value) => value.code)
  );
  externalProtocolFunctionInformation['event_source'].push(
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
  eventSourceContext: RenderRegularParameters
): Promise<SingleFunctionRenderType[]> {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const payloadId = findOperationId(operation, channel);
    const payload = payloads.operationModels[payloadId];
    if (!payload) {
      throw new Error(
        `Could not find payload for operation in channel typescript generator for EventSource`
      );
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for EventSource`
      );
    }
    const updatedContext = {
      ...eventSourceContext,
      messageType,
      messageModule,
      subName: findNameFromOperation(operation, channel)
    };

    renders.push(
      ...generateOperationRenders(
        operation,
        updatedContext,
        updatedFunctionTypeMapping,
        generator
      )
    );
  }
  return renders;
}

function generateOperationRenders(
  operation: any,
  eventSourceContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
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
          fetchDependency: generator.eventSourceDependency
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

  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  eventSourceContext: RenderRegularParameters
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
      `Could not find message type for channel typescript generator for EventSource`
    );
  }
  const updatedContext = {...eventSourceContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.EVENT_SOURCE_FETCH,
      render: renderFetch,
      action: 'receive'
    },
    {
      check: ChannelFunctionTypes.EVENT_SOURCE_EXPRESS,
      render: renderExpress,
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
      renders.push(
        render({
          ...updatedContext,
          additionalProperties:
            check === ChannelFunctionTypes.EVENT_SOURCE_FETCH
              ? {fetchDependency: generator.eventSourceDependency}
              : undefined
        })
      );
    }
  }
  return renders;
}
