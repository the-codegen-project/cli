import {ChannelFunctionTypes} from './types';

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
  ChannelFunctionTypes.EVENT_SOURCE_FETCH
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
