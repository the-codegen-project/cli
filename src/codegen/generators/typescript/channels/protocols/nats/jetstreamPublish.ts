/* eslint-disable sonarjs/no-nested-template-literals */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ChannelFunctionTypes} from '../../index';
import {RenderRegularParameters} from '../../types';
import {generateHeaderSetupCode, generateHeaderParameter} from './utils';
import {
  parameterInstanceExpression,
  parameterUnionType,
  payloadInstanceExpression,
  payloadUnionType,
  renderChannelJSDoc
} from '../../utils';
export function renderJetstreamPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `jetStreamPublishTo${subName}`,
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

  const headerSetup = generateHeaderSetupCode(channelHeaders);

  const publishOperation =
    messageType === 'null'
      ? `${headerSetup}
      await js.publish(${addressToUse}, Nats.Empty, options);`
      : `let dataToSend: any = ${messageMarshalling};
      ${headerSetup}
dataToSend = codec.encode(dataToSend);
await js.publish(${addressToUse}, dataToSend, options);`;

  const headerParam = generateHeaderParameter(channelHeaders);
  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageInputType}`,
      jsDoc: ' * @param message to publish over jetstream'
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
    ...(headerParam ? [headerParam] : []),
    {
      parameter: 'js',
      parameterType: 'js: Nats.JetStreamClient',
      jsDoc: ' * @param js the JetStream client to publish from'
    },
    {
      parameter: 'codec = Nats.JSONCodec()',
      parameterType: 'codec?: Nats.Codec<any>',
      jsDoc:
        ' * @param codec the serialization codec to use while transmitting the message'
    },
    {
      parameter: 'options = {}',
      parameterType: 'options?: Partial<Nats.JetStreamPublishOptions>',
      jsDoc: ' * @param options to use while publishing the message'
    }
  ];

  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `JetStream publish operation for \`${topic}\``,
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
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH
  };
}
