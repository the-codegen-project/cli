/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderCoreSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  payloadGenerator,
  functionName = `subscribeTo${subName}`,
}: RenderRegularParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }
  let validatorCreation = '';
  let validationFunction = '';
  if (includeValidation) {
    validatorCreation = `const validator = ${messageModule ? messageModule : messageType}.createValidator();`;
    if (channelParameters) {
      validationFunction = `const {valid, errors} = ${messageModule ? messageModule : messageType}.validate({data: receivedData, ajvValidatorFunction: validator});
  if(!valid) {
    onDataCallback(new Error('Invalid message payload received, ignoring', {cause: errors}), undefined, msg);
    continue;
  }`;
    } else {
      validationFunction = `const {valid, errors} = ${messageModule ? messageModule : messageType}.validate({data: receivedData, ajvValidatorFunction: validator});
  if(!valid) {
    onDataCallback(new Error('Invalid message payload received, ignoring', {cause: errors}), undefined, parameters, msg);
    continue;
  }`;
    }
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

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
      parameter: `natsMsg?: Nats.Msg`,
      jsDoc: ' * @param natsMsg'
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
      parameter: 'nc: Nats.NatsConnection',
      jsDoc: ' * @param nc the NATS client to subscribe through'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use while receiving the message'
    },
    {
      parameter: 'options?: Nats.SubscriptionOptions',
      jsDoc: ' * @param options when setting up the subscription'
    }
  ];
  let whenReceivingMessage = '';
  if (channelParameters) {
    if (messageType === 'null') {
      whenReceivingMessage = `onDataCallback(undefined, null, parameters, msg);`;
    } else {
      whenReceivingMessage = `let receivedData: any = codec.decode(msg.data);
${validationFunction}
onDataCallback(undefined, ${messageUnmarshalling}, parameters, msg);`;
    }
  } else if (messageType === 'null') {
      whenReceivingMessage = `onDataCallback(undefined, null, msg);`;
    } else {
      whenReceivingMessage = `let receivedData: any = codec.decode(msg.data);
${validationFunction}
onDataCallback(undefined, ${messageUnmarshalling}, msg);`;
    }
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
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', \n')}
): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe(${addressToUse}, options);
      ${validatorCreation}
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
