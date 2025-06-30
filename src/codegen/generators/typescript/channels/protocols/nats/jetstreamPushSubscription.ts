/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {getValidationFunctions} from '../../utils';

export function renderJetstreamPushSubscription({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  payloadGenerator,
  functionName = `jetStreamPushSubscriptionFrom${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule,
      messageType,
      onValidationFail: channelParameters
        ? `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, parameters, msg); continue;`
        : `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, msg); continue;`
    });

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${messageType}`,
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
      parameter: `onDataCallback`,
      parameterType: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when messages are received`
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
      jsDoc: ' * @param js the JetStream client to pull subscribe through'
    },
    {
      parameter: 'options',
      parameterType:
        'options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>',
      jsDoc: ' * @param options when setting up the subscription'
    },
    {
      parameter: 'codec = Nats.JSONCodec()',
      parameterType: 'codec?: Nats.Codec<any>',
      jsDoc:
        ' * @param codec the serialization codec to use while transmitting the message'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  const whenReceivingMessage = channelParameters
    ? messageType === 'null'
      ? `onDataCallback(undefined, null, parameters, msg);`
      : `let receivedData: any = codec.decode(msg.data);
${potentialValidationFunction}
onDataCallback(undefined, ${messageUnmarshalling}, parameters, msg);`
    : messageType === 'null'
      ? `onDataCallback(undefined, null, msg);`
      : `let receivedData: any = codec.decode(msg.data);
${potentialValidationFunction}
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
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe(${addressToUse}, options);
      ${potentialValidatorCreation}
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
    messageType,
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE
  };
}
