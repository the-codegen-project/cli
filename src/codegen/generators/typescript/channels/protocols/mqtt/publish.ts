/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {renderChannelJSDoc} from '../../utils';

export function renderPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}`,
  description,
  deprecated
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const headersHandling = channelHeaders
    ? `// Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        const userProperties: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            userProperties[key] = String(value);
          }
        }
        publishOptions.properties = { userProperties };
      }`
    : `let publishOptions: Mqtt.IClientPublishOptions = {};`;

  const publishOperation =
    messageType === 'null'
      ? `${headersHandling}
      mqtt.publish(${addressToUse}, '', publishOptions);`
      : `let dataToSend: any = ${messageMarshalling};
      ${headersHandling}
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

  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `MQTT publish operation for \`${topic}\``,
    parameters: functionParameters.map((param) => ({
      name: param.parameter,
      jsDoc: param.jsDoc
    }))
  });

  const code = `${jsDoc}
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
