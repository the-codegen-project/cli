import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderCorePublish({
  topic,
  message,
  channelParameters,
  functionName = `publishTo${pascalCase(topic)}`
}: {
  topic: string;
  message: ConstrainedMetaModel;
  channelParameters: ConstrainedObjectModel | undefined;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : topic;

  const publishOperation = message.type === 'null'
    ? `await nc.publish(${addressToUse}, Nats.Empty, options);`
    : `let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
nc.publish(${addressToUse}, dataToSend, options);`;

  const functionParameters = [
    { parameter: `message: ${message.type}`, jsDoc: ' * @param message to publish' },
    ...(channelParameters ? [{ parameter: `parameters: ${channelParameters.type}`, jsDoc: ' * @param parameters for topic substitution' }] : []),
    { parameter: 'nc: Nats.NatsConnection', jsDoc: ' * @param nc the NATS client to publish from' },
    { parameter: 'codec: any = Nats.JSONCodec()', jsDoc: ' * @param codec the serialization codec to use while transmitting the message' },
    { parameter: 'options?: Nats.PublishOptions', jsDoc: ' * @param options to use while publishing the message' }
  ];

  const code = `/**
 * NATS publish operation for \`${topic}\`
 * 
 ${functionParameters.map(param => param.jsDoc).join('\n')}
 */
export function ${functionName}(
  ${functionParameters.map(param => param.parameter).join(', ')}
): Promise<void> {
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
