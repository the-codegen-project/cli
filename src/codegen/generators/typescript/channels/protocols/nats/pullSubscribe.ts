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
  const hasNullPayload = message.type === 'null';
  const addressToUse =
    channelParameters !== undefined
      ? `parameters.getChannelWithParameters('${topic}')`
      : topic;
  const dependencies = [`import * as Nats from 'nats';`];

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: '* @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${message.type}`,
      jsDoc: '* @param msg that was received'
    }
  ];
  if (channelParameters !== undefined) {
    callbackFunctionParameters.push({
      parameter: `parameters?: ${channelParameters.type}`,
      jsDoc: '* @param parameters that was received in the topic'
    });
  }
  callbackFunctionParameters.push(
    ...[
      {parameter: 'jetstreamMsg?: Nats.JsMsg', jsDoc: '* @param jetstreamMsg '}
    ]
  );
  const jsDocCallbackParameters = callbackFunctionParameters.map(
    (parameter) => parameter.jsDoc
  );
  const callbackParameters = callbackFunctionParameters.map(
    (parameter) => parameter.parameter
  );

  const functionParameters = [
    {
      parameter: `onDataCallback: (${callbackParameters.join(', ')}) => void`,
      jsDoc: `* @param {${functionName}Callback} onDataCallback to call when messages are received`
    }
  ];
  if (channelParameters !== undefined) {
    functionParameters.push({
      parameter: `parameters: ${channelParameters.type}`,
      jsDoc: '* @param parameters for topic substitution'
    });
  }
  functionParameters.push(
    ...[
      {
        parameter: 'js: Nats.JetStreamClient',
        jsDoc: '* @param flush ensure client is force flushed after subscribing'
      },
      {
        parameter: 'codec: any = Nats.JSONCodec()',
        jsDoc:
          '* @param codec the serialization codec to use while transmitting the message'
      },
      {
        parameter:
          'options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts> = {}',
        jsDoc: '* @param options when setting up the subscription'
      }
    ]
  );

  // Determine the callback process when receiving messages.
  // If the message payload is null no hooks are called to process the received data.
  let whenReceivingMessage = `onDataCallback(undefined, null, parameters, msg);`;
  if (channelParameters !== undefined) {
    if (!hasNullPayload) {
      whenReceivingMessage = `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${message.type}.unmarshal(receivedData), parameters, msg);`;
    }
  } else {
    let whenReceivingMessage = `onDataCallback(undefined, null, msg);`;
    if (!hasNullPayload) {
      whenReceivingMessage = `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${message.type}.unmarshal(receivedData), msg);`;
    }
  }

  const jsDocParameters = functionParameters.map(
    (parameter) => parameter.jsDoc
  );
  const parameters = functionParameters.map((parameter) => parameter.parameter);
  const code = `/**
* Callback for when receiving messages
*
* @callback ${functionName}Callback
${jsDocCallbackParameters.join('\n')}
*/

  /**
* JetStream pull subscription for \`${addressToUse}\`
* 
${jsDocParameters.join('\n')}
*/
export function ${functionName}(
${parameters.join(', ')}
): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(${addressToUse}, options);

      (async () => {
        for await (const msg of subscription) {
          ${channelParameters !== undefined ? unwrap(topic, channelParameters) : ''}
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
    dependencies
  };
}