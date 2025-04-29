/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;
  const publishOperation =
    messageType === 'null'
      ? `mqtt.publish(${addressToUse}, '');`
      : `let dataToSend: any = ${messageMarshalling};
mqtt.publish(${addressToUse}, dataToSend);`;

  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageType}`,
      jsDoc: ' * @param message to publish'
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
      parameter: 'mqtt',
      parameterType: 'mqtt: Mqtt.MqttClient',
      jsDoc: ' * @param mqtt the MQTT client to publish from'
    }
  ];

  const code = `/**
 * MQTT publish operation for \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      ${publishOperation}
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [`import * as Mqtt from 'mqtt';`],
    functionType: ChannelFunctionTypes.MQTT_PUBLISH
  };
}
