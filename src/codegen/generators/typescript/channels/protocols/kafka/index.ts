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
} from '../../../../../inputs/asyncapi/generators/channels';
import {renderPublish} from './publish';
import {renderSubscribe} from './subscribe';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export {renderPublish, renderSubscribe};

export async function generateKafkaChannels(
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
  let kafkaTopic = topic.startsWith('/') ? topic.slice(1) : topic;
  kafkaTopic = kafkaTopic.replace(/\//g, context.generator.kafkaTopicSeparator);

  const kafkaContext: RenderRegularParameters = {
    channelParameters: parameter,
    topic: kafkaTopic,
    messageType: '',
    subName: context.subName,
    payloadGenerator: context.payloads
  };

  const operations = channel.operations().all();
  const renders =
    operations.length > 0 && !ignoreOperation
      ? await generateForOperations(context, channel, kafkaContext)
      : await generateForChannels(context, channel, kafkaContext);

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
  protocolCodeFunctions['kafka'].push(...renders.map((value) => value.code));
  externalProtocolFunctionInformation['kafka'].push(
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
  kafkaContext: RenderRegularParameters
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
        `Could not find payload for operation in channel typescript generator for Kafka`
      );
    }

    const {messageModule, messageType} = getMessageTypeAndModule(payload);
    if (messageType === undefined) {
      throw new Error(
        `Could not find message type for channel typescript generator for Kafka`
      );
    }
    const updatedContext = {
      ...kafkaContext,
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
  kafkaContext: RenderRegularParameters,
  functionTypeMapping: ChannelFunctionTypes[] | undefined,
  generator: any
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
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

  return renders;
}

async function generateForChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  kafkaContext: RenderRegularParameters
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
      `Could not find message type for channel typescript generator for Kafka`
    );
  }
  const updatedContext = {...kafkaContext, messageType, messageModule};

  const renderChecks = [
    {
      check: ChannelFunctionTypes.KAFKA_PUBLISH,
      render: renderPublish,
      action: 'send'
    },
    {
      check: ChannelFunctionTypes.KAFKA_SUBSCRIBE,
      render: renderSubscribe,
      action: 'receive'
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
