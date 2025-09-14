/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderWebSocketPublish({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

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
            jsDoc: ' * @param parameters for URL path substitution'
          }
        ]
      : []),
    {
      parameter: 'ws',
      parameterType: 'ws: WebSocket.WebSocket',
      jsDoc: ' * @param ws the WebSocket connection (assumed to be already connected)'
    }
  ];

  const code = `/**
 * WebSocket client-side function to publish messages to \`${topic}\`
 * 
${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(',\n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(',\n  ')}
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if WebSocket is open
      if (ws.readyState !== WebSocket.WebSocket.OPEN) {
        reject(new Error('WebSocket is not open'));
        return;
      }

      // Send message directly
      ws.send(${messageMarshalling});
      resolve();
    } catch (error: any) {
      reject(new Error(\`Failed to send message: \${error.message}\`));
    }
  });
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [`import * as WebSocket from 'ws';`],
    functionType: ChannelFunctionTypes.WEBSOCKET_PUBLISH
  };
}
