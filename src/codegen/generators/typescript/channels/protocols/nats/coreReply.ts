/* eslint-disable no-nested-ternary */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase, unwrap} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderCoreReply({
  requestTopic,
  replyTopic,
  requestMessage,
  replyMessage,
  channelParameters,
  functionName = `replyTo${pascalCase(requestTopic)}`
}: {
  requestTopic: string;
  replyTopic: undefined;
  requestMessage: ConstrainedMetaModel;
  replyMessage: ConstrainedMetaModel;
  channelParameters: ConstrainedObjectModel | undefined;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : requestTopic;

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${replyMessage.type}`,
      jsDoc: ' * @param msg that was received from the request'
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
      parameter: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
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
      parameter:
        'options: Nats.SubscriptionOptions = {}',
      jsDoc: ' * @param options when setting up the reply'
    }
  ];

  //Determine the receiving process based on whether the payload type is null
  let receivingOperation = `let message = await onRequest(undefined, null, parameters ?? undefined);`;
  if (requestMessage.type !== 'null') {
    receivingOperation = `let receivedData : any = codec.decode(msg.data);
let replyMessage = await onRequest(undefined, ${requestMessage.type}.unmarshal(), parameters ?? undefined);`;
  }

  //Determine the reply process based on whether the payload type is null
  let replyOperation = 'msg.respond(Nats.Empty);';
  if (replyMessage.type !== 'null') {
    replyOperation = `let dataToSend : any = replyMessage.marshal();
dataToSend = codec.encode(dataToSend);
msg.respond(dataToSend);`;
  }

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
export function ${functionName}(
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      let subscription = nc.subscribe(${addressToUse}, subscribeOptions);

      (async () => {
        for await (const msg of subscription) {
          ${channelParameters ? unwrap(requestTopic, channelParameters) : ''}

          ${receivingOperation}

          if (msg.reply) {
            ${replyOperation}
          } else {
            onReplyError(new Error('Expected request to need a reply, did not..'))
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
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`]
  };
}
