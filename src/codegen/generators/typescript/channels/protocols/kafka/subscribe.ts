/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import { getValidationFunctions } from '../../utils';

export function renderSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `consumeFrom${subName}`,
  payloadGenerator
}: RenderRegularParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  const messageUnmarshalling = `${messageModule ?? messageType}.unmarshal(receivedData)`;
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule: messageModule,
      messageType: messageType,
      onValidationFail: `return reject(new Error('Invalid message payload received', {cause: errors}));`
    });

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${messageType}`,
      jsDoc: ' * @param msg that was received'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters?: ${channelParameters.type}`,
            jsDoc: ' * @param parameters that was received in the topic'
          }
        ]
      : []),
    {
      parameter: `kafkaMsg?: Kafka.EachMessagePayload`,
      jsDoc: ' * @param kafkaMsg'
    }
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when messages are received`
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters: ${channelParameters.type}`,
            jsDoc: ' * @param parameters for topic substitution'
          }
        ]
      : []),
    {
      parameter: 'kafka: Kafka.Kafka',
      jsDoc: ' * @param kafka the KafkaJS client to subscribe through'
    },
    {
      parameter:
        "options: {fromBeginning: boolean, groupId: string} = {fromBeginning: true, groupId: ''}",
      jsDoc: ' * @param options when setting up the subscription'
    },
    {
      parameter: 'skipMessageValidation: boolean = false',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of outgoing messages'
    }
  ];
  let whenReceivingMessage = '';
  if (channelParameters) {
    if (messageType === 'null') {
      whenReceivingMessage = `onDataCallback(undefined, null, parameters, kafkaMessage);`;
    } else {
      whenReceivingMessage = `const callbackData = ${messageUnmarshalling};
${potentialValidationFunction}
onDataCallback(undefined, callbackData, parameters, kafkaMessage);`;
    }
  } else if (messageType === 'null') {
    whenReceivingMessage = `onDataCallback(undefined, null, kafkaMessage);`;
  } else {
    whenReceivingMessage = `const callbackData = ${messageUnmarshalling};
${potentialValidationFunction}
onDataCallback(undefined, callbackData, kafkaMessage);`;
  }
  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');
  const callbackJsDocParameters = callbackFunctionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Callback for when receiving messages
 *
 * @callback ${functionName}Callback
 ${callbackJsDocParameters}
 */

/**
 * Kafka subscription for \`${topic}\`
 * 
 ${jsDocParameters}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<Kafka.Consumer> => {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      ${potentialValidatorCreation}
      await consumer.connect();
      await consumer.subscribe({ topic: ${addressToUse}, fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          ${channelParameters ? `const parameters = ${channelParameters.type}.createFromChannel(topic, '${topic}', ${findRegexFromChannel(topic)});` : ''}
          ${whenReceivingMessage}
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [`import * as Kafka from 'kafkajs';`],
    functionType: ChannelFunctionTypes.KAFKA_SUBSCRIBE
  };
}
