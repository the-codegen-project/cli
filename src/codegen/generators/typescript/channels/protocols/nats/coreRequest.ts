/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderCoreRequest({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  subName = pascalCase(requestTopic),
  functionName = `requestTo${subName}`
}: {
  requestTopic: string;
  requestMessageType: string,
  requestMessageModule: string | undefined,
  replyMessageType: string,
  replyMessageModule: string | undefined,
  channelParameters: ConstrainedObjectModel | undefined;
  subName?: string;
  functionName?: string;
}): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;

  const functionParameters = [
    {
      parameter: `requestMessage: ${requestMessageModule ? `${requestMessageModule}.${requestMessageType}` : requestMessageType}`,
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
  const requestOperation = `let dataToSend: any = codec.encode(requestMessage.marshal());
const msg = await nc.request(${addressToUse}, ${requestMessageMarshalling}, options)`;

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
): Promise<${replyMessageModule ? `${replyMessageModule}.${replyMessageType}` : replyMessageType}> => {
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
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_REQUEST
  };
}
