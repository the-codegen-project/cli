/* eslint-disable no-nested-ternary */
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {ConstrainedMetaModel, ConstrainedObjectModel} from '@asyncapi/modelina';

export function renderCoreRequest({
  requestTopic,
  replyTopic,
  requestMessage,
  replyMessage,
  channelParameters,
  functionName = `requestTo${pascalCase(requestTopic)}`
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

  const functionParameters = [
    {
      parameter: `requestMessage: ${requestMessage.type}`,
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
      parameter: 'options: Nats.RequestOptions = {}',
      jsDoc: ' * @param options when making the request'
    }
  ];

  //Determine the request operation based on whether the message type is null
  let requestOperation = `const msg = await nc.request(${addressToUse}, Nats.Empty, options)`;
  if (requestMessage.type !== 'null') {
    requestOperation = `let dataToSend: any = codec.encode(requestMessage.marshal());
const msg = await nc.request(${addressToUse}, dataToSend, options)`;
  }

  //Determine the request callback operation based on whether the message type is null
  let requestCallbackOperation = 'resolve(null);';
  if (replyMessage.type !== 'null') {
    requestCallbackOperation = `let receivedData = codec.decode(msg.data);
resolve(${replyMessage.type}.unmarshal(receivedData));`;
  }

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Request to \`${requestTopic}\`
 * 
 ${jsDocParameters}
 */
export function ${functionName}(
  ${functionParameters.map((param) => param.parameter).join(', ')}
): Promise<${replyMessage.type}> {
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
    dependencies: [`import * as Nats from 'nats';`]
  };
}
