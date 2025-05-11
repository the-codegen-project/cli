import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {getValidationFunctions} from '../../utils';

export function renderSubscribeQueue({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `subscribeTo${subName}Queue`,
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
      messageModule,
      messageType,
      onValidationFail: `onDataCallback(new Error('Invalid message payload received', {cause: errors}), undefined, msg); return;`
    });
  const subscribeOperation = `const channel = await amqp.createChannel();
const queue = ${addressToUse};
await channel.assertQueue(queue, { durable: true });
${potentialValidatorCreation}
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    ${potentialValidationFunction}
    const message = ${messageUnmarshalling};
    onDataCallback(undefined, message, msg);
  }
}, options);`;

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${messageType}`,
      jsDoc: ' * @param msg that was received'
    },
    {
      parameter: `amqpMsg?: Amqp.ConsumeMessage`,
      jsDoc: ' * @param amqpMsg'
    }
  ];
  const functionParameters = [
    {
      parameter: `onDataCallback`,
      parameterType: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when messages are received`
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters`,
            parameterType: `parameters: ${channelParameters.type}`,
            jsDoc: ' * @param parameters for topic substitution'
          }
        ]
      : []),
    {
      parameter: 'amqp',
      parameterType: 'amqp: Amqp.Connection',
      jsDoc: ' * @param amqp the AMQP connection to receive from'
    },
    {
      parameter: `options`,
      parameterType: `options?: Amqp.Options.Consume`,
      jsDoc: ' * @param options for the AMQP subscribe queue operation'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  const code = `/**
 * AMQP subscribe operation for queue \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<Amqp.Channel> => {
  return new Promise(async (resolve, reject) => {
    try {
      ${subscribeOperation}
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [`import * as Amqp from 'amqplib';`],
    functionType: ChannelFunctionTypes.AMQP_QUEUE_SUBSCRIBE
  };
}
