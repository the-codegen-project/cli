/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderJetstreamPullSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `jetStreamPullSubscribeTo${subName}`
}: {
  topic: string;
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
    {parameter: 'jetstreamMsg?: Nats.JsMsg', jsDoc: ' * @param jetstreamMsg'}
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
      parameter:
        'options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>',
      jsDoc: ' * @param options when setting up the subscription'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use while receiving the message'
    }
  ];

  const whenReceivingMessage = channelParameters
    ? messageType === 'null'
      ? `onDataCallback(undefined, null, parameters, msg);`
      : `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${messageUnmarshalling}, parameters, msg);`
    : messageType === 'null'
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
 * JetStream pull subscription for \`${topic}\`
 * 
 ${jsDocParameters}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(${addressToUse}, options);

      (async () => {
        for await (const msg of subscription) {
          ${channelParameters ? `const parameters = ${channelParameters.type}.createFromChannel(msg.subject, '${topic}', ${findRegexFromChannel(topic)})` : ''}
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
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE
  };
}
