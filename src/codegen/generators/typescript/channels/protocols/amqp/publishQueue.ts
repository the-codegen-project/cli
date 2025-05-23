/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderPublishQueue({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}Queue`
}: RenderRegularParameters): SingleFunctionRenderType {
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
const queue = ${addressToUse};
channel.sendToQueue(queue, Buffer.from(dataToSend), options);`;

  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageType}`,
      jsDoc: ' * @param message to publish'
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
      jsDoc: ' * @param amqp the AMQP connection to send over'
    },
    {
      parameter: `options`,
      parameterType: `options?: Amqp.Options.Publish`,
      jsDoc: ' * @param options for the AMQP publish queue operation'
    }
  ];

  const code = `/**
 * AMQP publish operation for queue \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
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
    functionType: ChannelFunctionTypes.AMQP_QUEUE_PUBLISH
  };
}
