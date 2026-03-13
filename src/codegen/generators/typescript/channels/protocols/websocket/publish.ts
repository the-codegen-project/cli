/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';
import {renderChannelJSDoc} from '../../utils';

export function renderWebSocketPublish({
  topic,
  messageType,
  messageModule,
  subName = pascalCase(topic),
  functionName = `publishTo${subName}`,
  description,
  deprecated
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
    {
      parameter: 'ws',
      parameterType: 'ws: WebSocket.WebSocket',
      jsDoc:
        ' * @param ws the WebSocket connection (assumed to be already connected)'
    }
  ];

  const jsDoc = renderChannelJSDoc({
    description,
    deprecated,
    fallbackDescription: `WebSocket client-side function to publish messages to \`${topic}\``,
    parameters: functionParameters.map((param) => ({
      name: param.parameter,
      jsDoc: param.jsDoc
    }))
  });

  const code = `${jsDoc}
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(',\n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(',\n  ')}
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(${messageMarshalling}, (err) => {
      if (err) {
        reject(new Error(\`Failed to send message: \${err.message}\`));
      }
      resolve();
    });
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
