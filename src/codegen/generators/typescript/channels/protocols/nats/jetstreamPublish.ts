import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderJetstreamPublish({
  topic,
  message,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `jetStreamPublishTo${subName}`
}: {
  topic: string;
  message: ConstrainedMetaModel;
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;

  const publishOperation =
    message.type === 'null'
      ? `await js.publish(${addressToUse}, Nats.Empty, options);`
      : `let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
await js.publish(${addressToUse}, dataToSend, options);`;

  const functionParameters = [
    {
      parameter: `message: ${message.type}`,
      jsDoc: ' * @param message to publish over jetstream'
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
      parameter: 'js: Nats.JetStreamClient',
      jsDoc: ' * @param js the JetStream client to publish from'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use while transmitting the message'
    },
    {
      parameter: 'options: Partial<Nats.JetStreamPublishOptions> = {}',
      jsDoc: ' * @param options to use while publishing the message'
    }
  ];

  const code = `/**
 * JetStream publish operation for \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<void> => {
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
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`]
  };
}
