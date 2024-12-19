/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes, RenderRequestReplyParameters} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';

export function renderCoreRequest({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  subName = pascalCase(requestTopic),
  functionName = `requestTo${subName}`
}: RenderRequestReplyParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;
  const messageType = requestMessageModule ? `${requestMessageModule}.${requestMessageType}` : requestMessageType;
  const replyType = replyMessageModule ? `${replyMessageModule}.${replyMessageType}` : replyMessageType;
  const functionParameters = [
    {
      parameter: `requestMessage: ${messageType}`,
      jsDoc: ' * @param requestMessage to make the request with'
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
      jsDoc: ' * @param nc the NATS client to make the request through'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use when sending the request and receiving the reply'
    },
    {
      parameter: 'options?: Nats.RequestOptions',
      jsDoc: ' * @param options when making the request'
    }
  ];

  //Determine the request operation based on whether the message type is null
  let requestMessageMarshalling = 'requestMessage.marshal()';
  if (requestMessageModule) {
    requestMessageMarshalling = `${requestMessageModule}.marshal(requestMessage)`;
  }
  const requestOperation = `let dataToSend: any = codec.encode(${requestMessageMarshalling});
const msg = await nc.request(${addressToUse}, dataToSend, options)`;

  //Determine the request callback operation based on message type
  const requestCallbackOperation = `let receivedData = codec.decode(msg.data);
const unmarshalData = ${replyMessageModule ?? replyMessageType}.unmarshal(receivedData);
resolve(unmarshalData);`;

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Request to \`${requestTopic}\`
 * 
 ${jsDocParameters}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<${replyType}> => {
  return new Promise(async (resolve, reject) => {
    try {
      ${requestOperation}
      ${requestCallbackOperation}
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
    functionType: ChannelFunctionTypes.NATS_REQUEST
  };
}
