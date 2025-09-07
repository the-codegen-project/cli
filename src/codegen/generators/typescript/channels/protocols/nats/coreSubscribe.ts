/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {getValidationFunctions} from '../../utils';
import {
  generateHeaderExtractionCode,
  generateHeaderCallbackParameter,
  generateMessageReceivingCode
} from './utils';

export function renderCoreSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  payloadGenerator,
  functionName = `subscribeTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule,
      messageType,
      onValidationFail:
        channelParameters && channelHeaders
          ? `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, parameters, extractedHeaders, msg); continue;`
          : channelParameters
            ? `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, parameters, msg); continue;`
            : channelHeaders
              ? `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, extractedHeaders, msg); continue;`
              : `onDataCallback(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), undefined, msg); continue;`
    });

  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const headerCallbackParam = generateHeaderCallbackParameter(channelHeaders);
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
    ...(headerCallbackParam ? [headerCallbackParam] : []),
    {
      parameter: `natsMsg?: Nats.Msg`,
      jsDoc: ' * @param natsMsg'
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
      parameter: 'nc',
      parameterType: 'nc: Nats.NatsConnection',
      jsDoc: ' * @param nc the nats client to setup the subscribe for'
    },
    {
      parameter: 'codec = Nats.JSONCodec()',
      parameterType: 'codec?: Nats.Codec<any>',
      jsDoc:
        ' * @param codec the serialization codec to use while receiving the message'
    },
    {
      parameter: 'options',
      parameterType: 'options?: Nats.SubscriptionOptions',
      jsDoc: ' * @param options when setting up the subscription'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];
  const headerExtraction = generateHeaderExtractionCode(channelHeaders);
  const whenReceivingMessage = generateMessageReceivingCode({
    channelParameters,
    channelHeaders,
    messageType,
    messageUnmarshalling,
    headerExtraction,
    potentialValidationFunction
  });
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
 * Core subscription for \`${topic}\`
 * 
${jsDocParameters}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe(${addressToUse}, options);
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
    functionType: ChannelFunctionTypes.NATS_SUBSCRIBE
  };
}
