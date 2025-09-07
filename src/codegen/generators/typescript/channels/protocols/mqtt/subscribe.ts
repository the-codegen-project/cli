/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable no-nested-ternary */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {getValidationFunctions} from '../../utils';

/* eslint-disable sonarjs/cognitive-complexity */
export function renderSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `subscribeTo${subName}`,
  payloadGenerator
}: RenderRegularParameters): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }

  // Constants for error messages and parameters
  const PARSE_MESSAGE_ERROR = 'Failed to parse message: ${err.message}';
  const PARSE_HEADERS_ERROR = 'Failed to parse headers: ${headerError}';
  const PARAMETERS_PARAM = ', parameters';
  const HEADERS_UNDEFINED_PARAM = ', headers: undefined';
  const HEADERS_EXTRACTED_PARAM = ', headers: extractedHeaders';

  const getValidationFailCallback = () => {
    const baseError = `new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`)`;
    const baseParams = `err: ${baseError}, msg: undefined`;

    if (channelParameters && channelHeaders) {
      return `onDataCallback({${baseParams}${PARAMETERS_PARAM}${HEADERS_EXTRACTED_PARAM}, mqttMsg: packet}); return;`;
    }
    if (channelParameters) {
      return `onDataCallback({${baseParams}${PARAMETERS_PARAM}, mqttMsg: packet}); return;`;
    }
    if (channelHeaders) {
      return `onDataCallback({${baseParams}${HEADERS_EXTRACTED_PARAM}, mqttMsg: packet}); return;`;
    }
    return `onDataCallback({${baseParams}, mqttMsg: packet}); return;`;
  };

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule,
      messageType,
      onValidationFail: getValidationFailCallback()
    });

  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be set'
    },
    {
      parameter: `msg?: ${messageType}`,
      jsDoc: ' * @param msg that was received'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters?: ${channelParameters.type}`,
            jsDoc: ' * @param parameters that was received in the topic'
          }
        ]
      : []),
    ...(channelHeaders
      ? [
          {
            parameter: `headers?: ${channelHeaders.type}`,
            jsDoc:
              ' * @param headers that was received with the message as MQTT user properties'
          }
        ]
      : []),
    {
      parameter: `mqttMsg?: Mqtt.IPublishPacket`,
      jsDoc: ' * @param mqttMsg the raw MQTT message packet'
    }
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback`,
      parameterType: `onDataCallback: (params: {${callbackFunctionParameters.map((param) => param.parameter).join(', ')}}) => void`,
      jsDoc: ` * @param onDataCallback to call when messages are received`
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
      jsDoc: ' * @param mqtt the MQTT client to subscribe with'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  // Generate message receiving code
  const whenReceivingMessage = `
    const receivedData = message.toString();
    ${channelParameters ? `const parameters = ${channelParameters.type}.createFromChannel(topic, '${topic}', ${findRegexFromChannel(topic)});` : ''}
    ${
      channelHeaders
        ? `
    // Extract headers from MQTT v5 user properties
    let extractedHeaders: ${channelHeaders.type} | undefined;
    if (packet.properties && packet.properties.userProperties) {
      try {
        extractedHeaders = new ${channelHeaders.type}(packet.properties.userProperties);
      } catch (headerError) {
        onDataCallback({err: new Error(\`${PARSE_HEADERS_ERROR}\`), msg: undefined${channelParameters ? PARAMETERS_PARAM : ''}${channelHeaders ? HEADERS_UNDEFINED_PARAM : ''}, mqttMsg: packet});
        return;
      }
    }`
        : ''
    }
    
    try {
      const parsedMessage = ${messageUnmarshalling};
      ${potentialValidationFunction}
      onDataCallback({err: undefined, msg: parsedMessage${channelParameters ? PARAMETERS_PARAM : ''}${channelHeaders ? HEADERS_EXTRACTED_PARAM : ''}, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(\`${PARSE_MESSAGE_ERROR}\`), msg: undefined${channelParameters ? PARAMETERS_PARAM : ''}${channelHeaders ? HEADERS_EXTRACTED_PARAM : ''}, mqttMsg: packet});
    }`;

  const jsDocParameters = functionParameters
    .map((param) => param.jsDoc)
    .join('\n');
  const callbackJsDocParameters = callbackFunctionParameters
    .map((param) => param.jsDoc)
    .join('\n');

  const code = `/**
 * Callback for when receiving messages
 *
 * @callback ${functionName}Callback
${callbackJsDocParameters}
 */

/**
 * MQTT subscription for \`${topic}\`
 * 
${jsDocParameters}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      ${potentialValidatorCreation}
      
      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        ${whenReceivingMessage}
      };
      
      mqtt.on('message', messageHandler);
      
      // Subscribe to the topic
      await mqtt.subscribeAsync(${addressToUse});
      
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
    functionType: ChannelFunctionTypes.MQTT_SUBSCRIBE
  };
}
