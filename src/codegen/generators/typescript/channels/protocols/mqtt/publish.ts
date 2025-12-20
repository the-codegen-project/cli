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
  channelHeaders,
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
      ? `// Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        publishOptions.properties = { userProperties: {} };
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            publishOptions.properties.userProperties[key] = String(value);
          }
        }
      }
      mqtt.publish(${addressToUse}, '', publishOptions);`
      : `let dataToSend: any = ${messageMarshalling};
      // Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        const userProperties = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            userProperties[key] = String(value);
          }
        }
        publishOptions.properties = { userProperties };
      }
      mqtt.publish(${addressToUse}, dataToSend, publishOptions);`;

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
    ...(channelHeaders
      ? [
          {
            parameter: `headers`,
            parameterType: `headers?: ${channelHeaders.type}`,
            jsDoc:
              ' * @param headers optional headers to include with the message as MQTT user properties'
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
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<void> {
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
