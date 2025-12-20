/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes, RenderRequestReplyParameters} from '../../types';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {getValidationFunctions} from '../../utils';

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

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule: replyMessageModule,
      messageType: replyMessageType,
      onValidationFail: `return reject(new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`));`
    });

  const functionParameters = [
    {
      parameter: `requestMessage`,
      parameterType: `requestMessage: ${requestType}`,
      jsDoc: ` * @param requestMessage the message to send`
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
      jsDoc: ' * @param nc the nats client to setup the request for'
    },
    {
      parameter: 'codec = Nats.JSONCodec()',
      parameterType: 'codec?: Nats.Codec<any>',
      jsDoc:
        ' * @param codec the serialization codec to use when transmitting request and receiving reply'
    },
    {
      parameter: 'options',
      parameterType: 'options?: Nats.RequestOptions',
      jsDoc: ' * @param options when sending the request'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
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
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<${replyType}> {
  return new Promise(async (resolve, reject) => {
    try {
      ${potentialValidatorCreation}
      let dataToSend: any = requestMessage.marshal();
      dataToSend = codec.encode(dataToSend);

      const msg = await nc.request(${addressToUse}, dataToSend, options);
      const receivedData: any = codec.decode(msg.data);
      ${potentialValidationFunction}
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
