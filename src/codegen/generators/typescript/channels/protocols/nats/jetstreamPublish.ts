/* eslint-disable sonarjs/no-nested-template-literals */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ChannelFunctionTypes} from '../../index';
import {RenderRegularParameters} from '../../types';
export function renderJetstreamPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `jetStreamPublishTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const publishOperation =
    messageType === 'null'
      ? `await js.publish(${addressToUse}, Nats.Empty, options);`
      : `let dataToSend: any = ${messageMarshalling};
dataToSend = codec.encode(dataToSend);
await js.publish(${addressToUse}, dataToSend, options);`;

  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageType}`,
      jsDoc: ' * @param message to publish over jetstream'
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

  const code = `/**
 * JetStream publish operation for \`${topic}\`
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
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH
  };
}
