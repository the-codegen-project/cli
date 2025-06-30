/* eslint-disable security/detect-object-injection */
import {
  AsyncAPIDocumentInterface,
  ChannelInterface,
  OperationInterface
} from '@asyncapi/parser';
import {TypeScriptParameterRenderType} from '../../../generators/typescript/parameters';
import {TypeScriptPayloadRenderType} from '../../../generators/typescript/payloads';
import {
  ChannelFunctionTypes,
  TypeScriptChannelRenderedFunctionType,
  SupportedProtocols,
  TypeScriptChannelsContext,
  TypeScriptChannelsGeneratorContext
} from '../../../generators/typescript/channels/types';
import {findNameFromChannel, findNameFromOperation, findOperationId, findReplyId} from '../../../utils';
import {ConstrainedObjectModel, OutputModel} from '@asyncapi/modelina';
import {generateNatsChannels} from '../../../generators/typescript/channels/protocols/nats';
import {generateKafkaChannels} from '../../../generators/typescript/channels/protocols/kafka';
import {generateMqttChannels} from '../../../generators/typescript/channels/protocols/mqtt';
import {generateAmqpChannels} from '../../../generators/typescript/channels/protocols/amqp';
import {generateEventSourceChannels} from '../../../generators/typescript/channels/protocols/eventsource';
import {addRendersToExternal, renderHttpFetchClient} from '../../../generators/typescript/channels/protocols/http';
import { getMessageTypeAndModule } from '../../../generators/typescript/channels/utils';
import { HttpRenderType } from '../../../types';

type Action = 'send' | 'receive' | 'subscribe' | 'publish';
const sendingFunctionTypes = [
  ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
  ChannelFunctionTypes.NATS_PUBLISH,
  ChannelFunctionTypes.NATS_REQUEST,
  ChannelFunctionTypes.MQTT_PUBLISH,
  ChannelFunctionTypes.KAFKA_PUBLISH,
  ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
  ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
  ChannelFunctionTypes.EVENT_SOURCE_EXPRESS,
  ChannelFunctionTypes.HTTP_CLIENT
];
const receivingFunctionTypes = [
  ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
  ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
  ChannelFunctionTypes.NATS_REPLY,
  ChannelFunctionTypes.NATS_SUBSCRIBE,
  ChannelFunctionTypes.KAFKA_SUBSCRIBE,
  ChannelFunctionTypes.EVENT_SOURCE_FETCH,
  ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE
];

// eslint-disable-next-line sonarjs/cognitive-complexity
export function shouldRenderFunctionType(
  givenFunctionTypes: ChannelFunctionTypes[] | undefined,
  functionTypesToCheckFor: ChannelFunctionTypes | ChannelFunctionTypes[],
  action: Action,
  reverseOperation: boolean
) {
  const listToCheck = [
    ...(Array.isArray(functionTypesToCheckFor)
      ? functionTypesToCheckFor
      : [functionTypesToCheckFor])
  ];
  const hasSendingOperation = action === 'send' || action === 'subscribe';
  const hasReceivingOperation = action === 'receive' || action === 'publish';
  const hasFunctionMappingConfig = givenFunctionTypes !== undefined;
  const checkForSending = listToCheck.some((item) =>
    sendingFunctionTypes.includes(item)
  );
  const checkForReceiving = listToCheck.some((item) =>
    receivingFunctionTypes.includes(item)
  );
  const hasFunctionType = (givenFunctionTypes ?? []).some((item) =>
    listToCheck.includes(item)
  );
  if (hasFunctionMappingConfig) {
    if (hasFunctionType) {
      const renderForSending = checkForSending && hasSendingOperation;
      const renderForReceiving = checkForReceiving && hasReceivingOperation;
      return renderForSending || renderForReceiving;
    }
    return false;
  }

  if (reverseOperation) {
    const renderForSending = hasSendingOperation && checkForReceiving;
    const renderForReceiving = hasReceivingOperation && checkForSending;
    return renderForSending || renderForReceiving;
  }

  const renderForSending = checkForSending && hasSendingOperation;
  const renderForReceiving = checkForReceiving && hasReceivingOperation;
  return renderForSending || renderForReceiving;
}

export async function generateTypeScriptChannelsForAsyncAPI(
  context: TypeScriptChannelsContext,
  parameters: TypeScriptParameterRenderType,
  payloads: TypeScriptPayloadRenderType,
  protocolsToUse: SupportedProtocols[],
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
): Promise<void> {
  const {asyncapiDocument} = validateAsyncapiContext(context);
  const channels = asyncapiDocument
    .allChannels()
    .all()
    .filter((channel) => channel.address() && channel.messages().length > 0);

  for (const channel of channels) {
    const subName = findNameFromChannel(channel);
    let parameter: OutputModel | undefined = undefined;
    if (channel.parameters().length > 0) {
      parameter = parameters.channelModels[channel.id()];
      if (parameter === undefined) {
        throw new Error(
          `Could not find parameter for ${channel.id()} for channel TypeScript generator`
        );
      }
    }

    for (const protocol of protocolsToUse) {
      const protocolContext: TypeScriptChannelsGeneratorContext = {
        ...context,
        subName,
        topic: channel.address()!,
        parameter: parameter?.model as ConstrainedObjectModel,
        payloads
      };

      switch (protocol) {
        case 'nats':
          await generateNatsChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        case 'kafka':
          await generateKafkaChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        case 'mqtt':
          await generateMqttChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        case 'amqp':
          await generateAmqpChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        case 'http_client':
          await generatehttpChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        case 'event_source':
          await generateEventSourceChannels(
            protocolContext,
            channel,
            protocolCodeFunctions,
            externalProtocolFunctionInformation,
            dependencies
          );
          break;
        default:
          break;
      }
    }
  }
}

function validateAsyncapiContext(context: TypeScriptChannelsContext): {
  asyncapiDocument: AsyncAPIDocumentInterface;
} {
  const {asyncapiDocument, inputType} = context;
  if (inputType !== 'asyncapi') {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  if (asyncapiDocument === undefined) {
    throw new Error('Expected a parsed AsyncAPI document, was not given');
  }
  return {asyncapiDocument};
}

export function getFunctionTypeMappingFromAsyncAPI(
  object: OperationInterface | ChannelInterface
): ChannelFunctionTypes[] | undefined {
  return (
    object.extensions().get('x-the-codegen-project')?.value()
      ?.functionTypeMapping ?? undefined
  );
}

export async function generatehttpChannels(
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
  let renders: any[] = [];
  const operations = channel.operations().all();
  if (operations.length > 0 && !ignoreOperation) {
    renders = generateForOperations(context, channel, topic, parameter);
  }
  addRendersToExternal(
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  );
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  topic: string,
  parameters: ConstrainedObjectModel | undefined
): HttpRenderType[] {
  const renders: HttpRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const action = operation.action();
    if (
      shouldRenderFunctionType(
        updatedFunctionTypeMapping,
        ChannelFunctionTypes.HTTP_CLIENT,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      const httpMethod =
        operation.bindings().get('http')?.json()['method'] ?? 'GET';
      const payloadId = findOperationId(operation, channel);
      const payload = payloads.operationModels[payloadId];
      if (payload === undefined && httpMethod === 'POST') {
        throw new Error(
          `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
        );
      }
      const {messageModule, messageType} = getMessageTypeAndModule(payload);
      const reply = operation.reply();
      if (reply) {
        const replyId = findReplyId(operation, reply, channel);
        const replyMessageModel = payloads.operationModels[replyId];
        if (!replyMessageModel) {
          throw new Error(
            `Could not find payload for reply ${replyId} for channel typescript generator for HTTP`
          );
        }
        const {
          messageModule: replyMessageModule,
          messageType: replyMessageType
        } = getMessageTypeAndModule(replyMessageModel);
        if (replyMessageType === undefined) {
          throw new Error(
            `Could not find reply message type for channel typescript generator for HTTP`
          );
        }
        renders.push(
          renderHttpFetchClient({
            subName: findNameFromOperation(operation, channel),
            requestMessageModule:
              httpMethod === 'POST' ? messageModule : undefined,
            requestMessageType: httpMethod === 'POST' ? messageType : undefined,
            replyMessageModule,
            replyMessageType,
            requestTopic: topic,
            method: httpMethod.toUpperCase(),
            channelParameters:
              parameters !== undefined ? (parameters as any) : undefined
          })
        );
      }
    }
  }
  return renders;
}
