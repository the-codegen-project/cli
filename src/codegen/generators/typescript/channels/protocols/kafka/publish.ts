/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  const messageMarshalling = `${messageModule ?? 'message'}.marshal(message)`;
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;
  const publishOperation =
    messageType === 'null'
      ? `let dataToSend: any = null;`
      : `let dataToSend: any = ${messageMarshalling};`;

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
      parameter: 'kafka: Kafka.Client',
      jsDoc: ' * @param kafka the KafkaJS client to publish from'
    }
  ];

  const code = `/**
 * Kafka publish operation for \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<Kafka.Producer> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      ${publishOperation}
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: ${addressToUse},
        messages: [
          { value: dataToSend },
        ],
      });
      resolve(producer);
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
    functionType: ChannelFunctionTypes.KAFKA_PUBLISH
  };
}
