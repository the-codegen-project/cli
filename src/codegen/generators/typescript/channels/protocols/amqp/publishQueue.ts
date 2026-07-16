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

export function renderPublishQueue({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}Queue`,
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

  const headersHandling = channelHeaders
    ? `// Set up message properties (headers) if provided
let publishOptions = { ...options };
if (headers) {
  const headerData = headers.marshal();
  const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
  publishOptions.headers = {};
  for (const [key, value] of Object.entries(parsedHeaders)) {
    if (value !== undefined) {
      publishOptions.headers[key] = value;
    }
  }
}`
    : `let publishOptions = { ...options };`;

  const publishOperation = `let dataToSend: any = ${messageType === 'null' ? 'null' : messageMarshalling};
const channel = await amqp.createChannel();
const queue = ${addressToUse};
${headersHandling}
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);`;

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

  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `AMQP publish operation for queue \`${topic}\``,
    parameters: functionParameters.map((param) => ({
      jsDoc: param.jsDoc
    }))
  });

  const code = `${jsDoc}
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<void> {
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
    messageUnionType: messageInputType,
    code,
    functionName,
    dependencies: [`import * as Amqp from 'amqplib';`],
    functionType: ChannelFunctionTypes.AMQP_QUEUE_PUBLISH
  };
}
