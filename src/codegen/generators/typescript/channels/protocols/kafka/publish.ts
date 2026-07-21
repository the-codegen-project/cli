/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {
  parameterInstanceExpression,
  parameterUnionType,
  payloadInstanceExpression,
  payloadUnionType,
  renderChannelJSDoc
} from '../../utils';

export function renderPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `produceTo${subName}`,
  description,
  deprecated
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `${parameterInstanceExpression({modelName: channelParameters.type, source: 'parameters'})}.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  // Object payloads gain a companion interface: widen the user-facing input to
  // `Interface | Class` and normalize to a class instance before `.marshal()`.
  const widenPayload = !messageModule && messageType !== 'null';
  let messageMarshalling = 'message.marshal()';
  let messageInputType = messageType;
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
    messageInputType = `${messageModule}.${messageType}`;
  } else if (widenPayload) {
    messageMarshalling = `${payloadInstanceExpression({messageType, source: 'message'})}.marshal()`;
    messageInputType = payloadUnionType({messageType});
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;
  const publishOperation =
    messageType === 'null'
      ? `let dataToSend: any = null;`
      : `let dataToSend: any = ${messageMarshalling};`;

  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageInputType}`,
      jsDoc: ' * @param message to publish'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters`,
            parameterType: `parameters: ${parameterUnionType(channelParameters.type)}`,
            jsDoc: ' * @param parameters for topic substitution'
          }
        ]
      : []),
    ...(channelHeaders
      ? [
          {
            parameter: `headers`,
            parameterType: `headers?: ${channelHeaders.type}`,
            jsDoc:
              ' * @param headers optional headers to include with the message'
          }
        ]
      : []),
    {
      parameter: 'kafka',
      parameterType: 'kafka: Kafka.Kafka',
      jsDoc: ' * @param kafka the KafkaJS client to publish from'
    }
  ];

  const headersHandling = channelHeaders
    ? `// Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }`
    : '';

  const headersInMessage = channelHeaders ? 'headers: messageHeaders' : '';

  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `Kafka publish operation for \`${topic}\``,
    parameters: functionParameters.map((param) => ({
      jsDoc: param.jsDoc
    }))
  });

  const code = `${jsDoc}
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      ${publishOperation}
      const producer = kafka.producer();
      await producer.connect();
      ${headersHandling}

      await producer.send({
        topic: ${addressToUse},
        messages: [
          {
            value: dataToSend${channelHeaders ? `,\n            ${headersInMessage}` : ''}
          },
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
    messageUnionType: messageInputType,
    code,
    functionName,
    dependencies: [`import * as Kafka from 'kafkajs';`],
    functionType: ChannelFunctionTypes.KAFKA_PUBLISH
  };
}
