/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes, RenderRequestReplyParameters} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {getValidationFunctions} from '../../utils';

export function renderCoreReply({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  subName = pascalCase(requestTopic),
  payloadGenerator,
  functionName = `replyTo${subName}`
}: RenderRequestReplyParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;

  const messageType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;
  const replyType = replyMessageModule ?? replyMessageType;

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule: requestMessageModule,
      messageType: requestMessageType,
      onValidationFail: channelParameters
        ? `onDataCallback(new Error('Invalid request payload received', {cause: errors}), undefined, parameters); continue;`
        : `onDataCallback(new Error('Invalid request payload received', {cause: errors}), undefined); continue;`
    });

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `requestMessage?: ${messageType}`,
      jsDoc: ' * @param requestMessage that was received from the request'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters?: ${channelParameters.type}`,
            jsDoc: ' * @param parameters that was received in the topic'
          }
        ]
      : [])
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback`,
      parameterType: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => ${replyType} | Promise<${replyType}>`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when the request is received`
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
      jsDoc: ' * @param nc the nats client to setup the reply for'
    },
    {
      parameter: 'codec = Nats.JSONCodec()',
      parameterType: 'codec?: Nats.Codec<any>',
      jsDoc:
        ' * @param codec the serialization codec to use when receiving request and transmitting reply'
    },
    {
      parameter: 'options',
      parameterType: 'options?: Nats.SubscriptionOptions',
      jsDoc: ' * @param options when setting up the reply'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  const receivingOperation = `let receivedData : any = codec.decode(msg.data);
${potentialValidationFunction}
const replyMessage = await onDataCallback(undefined, ${requestMessageModule ?? requestMessageType}.unmarshal(receivedData) ${channelParameters ? ', parameters ?? undefined' : ''});`;

  const replyOperation = `let dataToSend : any = replyMessage.marshal();
dataToSend = codec.encode(dataToSend);
msg.respond(dataToSend);`;

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');
  const callbackJsDocParameters = callbackFunctionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Callback for when receiving the request
 *
 * @callback ${functionName}Callback
 ${callbackJsDocParameters}
 */

/**
 * Reply for \`${requestTopic}\`
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
      let subscription = nc.subscribe(${addressToUse}, options);
      ${potentialValidatorCreation}
      (async () => {
        for await (const msg of subscription) {
          ${channelParameters ? `const parameters = ${channelParameters.type}.createFromChannel(msg.subject, '${requestTopic}', ${findRegexFromChannel(requestTopic)})` : ''}

          ${receivingOperation}

          if (msg.reply) {
            ${replyOperation}
          } else {
            onDataCallback(new Error('Expected request to need a reply, did not..'))
          }
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
    replyType,
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_REPLY
  };
}
