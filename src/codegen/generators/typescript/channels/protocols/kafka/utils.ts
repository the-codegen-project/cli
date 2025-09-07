import {ConstrainedObjectModel} from '@asyncapi/modelina';

/**
 * Generates the message receiving code for Kafka subscribe functions
 */
export function generateKafkaMessageReceivingCode({
  channelParameters,
  channelHeaders,
  messageType,
  messageUnmarshalling,
  potentialValidationFunction
}: {
  channelParameters?: ConstrainedObjectModel;
  channelHeaders?: ConstrainedObjectModel;
  messageType: string;
  messageUnmarshalling: string;
  potentialValidationFunction: string;
}): string {
  // Generate header extraction code
  const headerExtraction = channelHeaders
    ? `
          // Extract headers if present
          let extractedHeaders: ${channelHeaders.type} | undefined = undefined;
          if (message.headers) {
            const headerObj: Record<string, any> = {};
            for (const [key, value] of Object.entries(message.headers)) {
              if (value !== undefined) {
                headerObj[key] = value.toString();
              }
            }
            extractedHeaders = ${channelHeaders.type}.unmarshal(headerObj);
          }`
    : '';

  if (channelParameters && channelHeaders) {
    if (messageType === 'null') {
      return `${headerExtraction}
          onDataCallback(undefined, null, parameters, extractedHeaders, kafkaMessage);`;
    }
    return `${headerExtraction}
${potentialValidationFunction}
const callbackData = ${messageUnmarshalling};
onDataCallback(undefined, callbackData, parameters, extractedHeaders, kafkaMessage);`;
  } else if (channelParameters) {
    if (messageType === 'null') {
      return `onDataCallback(undefined, null, parameters, kafkaMessage);`;
    }
    return `${potentialValidationFunction}
const callbackData = ${messageUnmarshalling};
onDataCallback(undefined, callbackData, parameters, kafkaMessage);`;
  } else if (channelHeaders) {
    if (messageType === 'null') {
      return `${headerExtraction}
          onDataCallback(undefined, null, extractedHeaders, kafkaMessage);`;
    }
    return `${headerExtraction}
${potentialValidationFunction}
const callbackData = ${messageUnmarshalling};
onDataCallback(undefined, callbackData, extractedHeaders, kafkaMessage);`;
  } else if (messageType === 'null') {
    return `onDataCallback(undefined, null, kafkaMessage);`;
  }
  return `${potentialValidationFunction}
const callbackData = ${messageUnmarshalling};
onDataCallback(undefined, callbackData, kafkaMessage);`;
}
