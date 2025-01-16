/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderPublishExchange({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}Exchange`,
  additionalProperties
}: RenderRegularParameters<{exchange: string | undefined}>): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;
  const publishOperation = `let dataToSend: any = ${messageType === 'null' ? 'null' : messageMarshalling};
const channel = await amqp.createChannel();
const routingKey = ${addressToUse};
channel.publish(exchange, routingKey, Buffer.from(dataToSend), options);`;

  const functionParameters = [
    {
      parameter: `message: ${messageType}`,
      jsDoc: ' * @param message to publish'
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
      jsDoc: ' * @param amqp the AMQP connection to send over'
    },
    {
      parameter: `options?: {exchange: string | undefined} & Amqp.Options.Publish`
    }
  ];

  const code = `/**
 * AMQP publish operation for exchange \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {    
    const exchange = options?.exchange ?? '${additionalProperties?.exchange}';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      ${publishOperation}
      resolve();
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
    functionType: ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH
  };
}
