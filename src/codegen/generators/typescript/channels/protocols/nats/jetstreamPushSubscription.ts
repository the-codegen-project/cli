/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase, unwrap} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderJetstreamPushSubscription({
  topic,
  message,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `jetStreamPushSubscriptionFrom${subName}`
}: {
  topic: string;
  message: ConstrainedMetaModel;
  messageType: string;
  messageModule?: string;
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${messageModule ? `${messageModule}.${messageType}` : messageType}`,
      jsDoc: ' * @param msg that was received'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters?: ${channelParameters.type}`,
            jsDoc: ' * @param parameters that was received in the topic'
          }
        ]
      : []),
    {
      parameter: 'jetstreamMsg?: Nats.JsMsg',
      jsDoc: ' * @param jetstreamMsg'
    }
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when messages are received`
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
      jsDoc: ' * @param js the JetStream client to pull subscribe through'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use while receiving the message'
    },
    {
      parameter:
        'options: Nats.ConsumerOptsBuilder | Nats.ConsumerOpts',
      jsDoc: ' * @param options when setting up the subscription'
    }
  ];

  const whenReceivingMessage = channelParameters
    ? message.type === 'null'
      ? `onDataCallback(undefined, null, parameters, msg);`
      : `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${messageUnmarshalling}, parameters, msg);`
    : message.type === 'null'
      ? `onDataCallback(undefined, null, msg);`
      : `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${messageUnmarshalling}, msg);`;

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');
  const callbackJsDocParameters = callbackFunctionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Callback for when receiving messages
 *
 * @callback ${functionName}Callback
 ${callbackJsDocParameters}
 */

/**
 * JetStream push subscription for \`${topic}\`
 * 
 ${jsDocParameters}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe(${addressToUse}, options);

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
