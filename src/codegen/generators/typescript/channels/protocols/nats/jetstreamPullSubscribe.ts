/* eslint-disable no-nested-ternary */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase, unwrap} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderJetstreamPullSubscribe({
  topic,
  message,
  channelParameters,
  functionName = `jetStreamPullSubscribeTo${pascalCase(topic)}`
}: {
  topic: string;
  message: ConstrainedMetaModel;
  channelParameters: ConstrainedObjectModel | undefined;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : topic;

  const callbackFunctionParameters = [
    { parameter: 'err?: Error', jsDoc: ' * @param err if any error occurred this will be sat' },
    { parameter: `msg?: ${message.type}`, jsDoc: ' * @param msg that was received' },
    ...(channelParameters ? [{ parameter: `parameters?: ${channelParameters.type}`, jsDoc: ' * @param parameters that was received in the topic' }] : []),
    { parameter: 'jetstreamMsg?: Nats.JsMsg', jsDoc: ' * @param jetstreamMsg' }
  ];

  const functionParameters = [
    { parameter: `onDataCallback: (${callbackFunctionParameters.map(param => param.parameter).join(', ')}) => void`, jsDoc: `* @param {${functionName}Callback} onDataCallback to call when messages are received` },
    ...(channelParameters ? [{ parameter: `parameters: ${channelParameters.type}`, jsDoc: ' * @param parameters for topic substitution' }] : []),
    { parameter: 'js: Nats.JetStreamClient', jsDoc: ' * @param flush ensure client is force flushed after subscribing' },
    { parameter: 'codec: any = Nats.JSONCodec()', jsDoc: ' * @param codec the serialization codec to use while transmitting the message' },
    { parameter: 'options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts> = {}', jsDoc: ' * @param options when setting up the subscription' }
  ];

  const whenReceivingMessage = channelParameters
    ? (message.type === 'null' 
        ? `onDataCallback(undefined, null, parameters, msg);`
        : `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${message.type}.unmarshal(receivedData), parameters, msg);`)
    : (message.type === 'null'
        ? `onDataCallback(undefined, null, msg);`
        : `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${message.type}.unmarshal(receivedData), msg);`);

  const jsDocParameters = functionParameters.map(param => param.jsDoc).join('\n');
  const callbackJsDocParameters = callbackFunctionParameters.map(param => param.jsDoc).join('\n');

  const code = `/**
 * Callback for when receiving messages
 *
 * @callback ${functionName}Callback
 ${callbackJsDocParameters}
 */

/**
 * JetStream pull subscription for \`${addressToUse}\`
 * 
 ${jsDocParameters}
 */
export function ${functionName}(
  ${functionParameters.map(param => param.parameter).join(', ')}
): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(${addressToUse}, options);

      (async () => {
        for await (const msg of subscription) {
          ${channelParameters ? unwrap(topic, channelParameters) : ''}
          ${whenReceivingMessage}
        }
      })();
      resolve(subscription);
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
