import {
  AsyncAPIDocumentInterface,
  ChannelInterface,
  OperationInterface
} from '@asyncapi/parser';
import {TypeScriptParameterRenderType} from '../parameters';
import {TypeScriptPayloadRenderType} from '../payloads';
import {
  ChannelFunctionTypes,
  TypeScriptChannelRenderedFunctionType,
  SupportedProtocols,
  TypeScriptChannelsContext,
  TypeScriptChannelsGeneratorContext
} from './types';
import {findNameFromChannel} from '../../../utils';
import {ConstrainedObjectModel, OutputModel} from '@asyncapi/modelina';
import {generateNatsChannels} from './protocols/nats';
import {generateKafkaChannels} from './protocols/kafka';
import {generateMqttChannels} from './protocols/mqtt';
import {generateAmqpChannels} from './protocols/amqp';
import {generateEventSourceChannels} from './protocols/eventsource';

type Action = 'send' | 'receive' | 'subscribe' | 'publish';
const sendingFunctionTypes = [
  ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
  ChannelFunctionTypes.NATS_PUBLISH,
  ChannelFunctionTypes.NATS_REQUEST,
  ChannelFunctionTypes.MQTT_PUBLISH,
  ChannelFunctionTypes.KAFKA_PUBLISH,
  ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
  ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
  ChannelFunctionTypes.EVENT_SOURCE_EXPRESS
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
  const channels = asyncapiDocument!
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
