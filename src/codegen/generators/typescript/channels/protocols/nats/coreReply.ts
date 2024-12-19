/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes, RenderRequestReplyParameters} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';

export function renderCoreReply({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  subName = pascalCase(requestTopic),
  functionName = `replyTo${subName}`
}: RenderRequestReplyParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;

  const messageType = requestMessageModule ? `${requestMessageModule}.${requestMessageType}` : requestMessageType;
  const replyType = replyMessageModule ?? replyMessageType;
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
      parameter: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => ${replyType} | Promise<${replyType}>`,
      jsDoc: ` * @param {${functionName}Callback} onDataCallback to call when the request is received`
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
      jsDoc: ' * @param nc the nats client to setup the reply for'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use when receiving and transmitting reply'
    },
    {
      parameter: 'options?: Nats.SubscriptionOptions',
      jsDoc: ' * @param options when setting up the reply'
    }
  ];

  //Determine the receiving process based on message payload type
  const receivingOperation = `let receivedData : any = codec.decode(msg.data);
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
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      let subscription = nc.subscribe(${addressToUse}, options);
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
