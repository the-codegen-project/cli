import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderSubscribeQueue({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `subscribeTo${subName}Queue`
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  const messageUnmarshalling = `${messageModule ?? messageType}.unmarshal(msg.content.toString())`;
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const subscribeOperation = `const channel = await amqp.createChannel();
const queue = ${addressToUse};
await channel.assertQueue(queue, { durable: true });
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const message = ${messageUnmarshalling};
    onMessage({message, amqpMsg: msg});
  }
}, options);`;

  const functionParameters = [
    {
      parameter: `onMessage: (callback: {message: ${messageType}, amqpMsg: Amqp.ConsumeMessage}) => void`,
      jsDoc: ' * @param onMessage callback to handle received messages'
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
      parameter: 'amqp: Amqp.Connection',
      jsDoc: ' * @param amqp the AMQP connection to receive from'
    },
    {
      parameter: `options?: Amqp.Options.Consume`
    }
  ];

  const code = `/**
 * AMQP subscribe operation for queue \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(',\n  ')}
): Promise<Amqp.Channel> => {
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
