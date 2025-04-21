/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes, RenderRequestReplyParameters} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import { getValidationFunctions } from '../../utils';

export function renderCoreRequest({
  requestTopic,
  requestMessageType,
  requestMessageModule,
  replyMessageType,
  replyMessageModule,
  channelParameters,
  subName = pascalCase(requestTopic),
  payloadGenerator,
  functionName = `requestTo${subName}`
}: RenderRequestReplyParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${requestTopic}')`
    : `'${requestTopic}'`;

  const requestType = requestMessageModule
    ? `${requestMessageModule}.${requestMessageType}`
    : requestMessageType;
  const replyType = replyMessageModule
    ? `${replyMessageModule}.${replyMessageType}`
    : replyMessageType;

  let {potentialValidatorCreation, potentialValidationFunction} = getValidationFunctions({
    includeValidation, 
    messageModule: requestMessageModule, 
    messageType: requestMessageType, 
    onValidationFail: `throw new Error('Invalid request payload provided');`
  });

  const functionParameters = [
    {
      parameter: `requestMessage: ${requestType}`,
      jsDoc: ` * @param requestMessage the message to send`
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
      jsDoc: ' * @param nc the NATS client to send the request through'
    },
    {
      parameter: 'codec: any = Nats.JSONCodec()',
      jsDoc:
        ' * @param codec the serialization codec to use when sending and receiving the message'
    },
    {
      parameter: 'options?: Nats.RequestOptions',
      jsDoc: ' * @param options when sending the request'
    },
    {
      parameter: 'validateMessages?: boolean',
      jsDoc: ' * @param validateMessages turn off runtime validation of outgoing messages'
    }
  ];

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Core request for \`${requestTopic}\`
 * 
 ${jsDocParameters}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
): Promise<${replyType}> => {
  return new Promise(async (resolve, reject) => {
    try {
      ${potentialValidatorCreation}
      ${potentialValidationFunction}
      let dataToSend: any = requestMessage.marshal();
      dataToSend = codec.encode(dataToSend);

      const msg = await nc.request(${addressToUse}, dataToSend, options);
      const receivedData: any = codec.decode(msg.data);
      resolve(${replyMessageModule ? `${replyMessageModule}.unmarshal(receivedData)` : `${replyMessageType}.unmarshal(receivedData)`});
    } catch (e: any) {
      reject(e);
    }
  });
}`;

  return {
    messageType: requestType,
    replyType,
    code,
    functionName,
    dependencies: [`import * as Nats from 'nats';`],
    functionType: ChannelFunctionTypes.NATS_REQUEST
  };
}
