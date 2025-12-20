/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderWebSocketRegister({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `register${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  // Create channel pattern based on topic
  const channelPattern = topic.replace(/\{[^}]+\}/g, '([^\\/]*)');
  const escapedChannelPattern = channelPattern.replace(/\//g, '\\/');
  const regexPattern = `/^${escapedChannelPattern}(?:\\?.*)?$/`;

  // Create parameter extraction logic
  const topicWithoutLeadingSlash = topic.startsWith('/')
    ? topic.slice(1)
    : topic;
  const channelPatternWithoutLeadingSlash = topicWithoutLeadingSlash.replace(
    /\{[^}]+\}/g,
    '([^\\/]*)'
  );
  const parameterExtraction = channelParameters
    ? `const channelPath = url.startsWith('/') ? url.slice(1) : url;
              const parameters = ${channelParameters.type}.createFromChannel(channelPath, '${topicWithoutLeadingSlash}', /^${channelPatternWithoutLeadingSlash.replace(/\//g, '\\/')}$/);`
    : '';

  const onConnectionParameters = [
    ...(channelParameters ? [`parameters: ${channelParameters.type}`] : []),
    'ws: WebSocket.WebSocket',
    'request: IncomingMessage'
  ];

  const onMessageParameters = [
    `message: ${messageType}`,
    'ws: WebSocket.WebSocket'
  ];

  const functionParameters = [
    {
      parameter: `wss`,
      parameterType: `wss: WebSocket.WebSocketServer`,
      jsDoc: ' * @param wss the WebSocket server instance'
    },
    {
      parameter: `onConnection`,
      parameterType: `onConnection: (params: {${onConnectionParameters.join(', ')}}) => void`,
      jsDoc:
        ' * @param onConnection callback when a client connects to this channel'
    },
    {
      parameter: `onMessage`,
      parameterType: `onMessage: (params: {${onMessageParameters.join(', ')}}) => void`,
      jsDoc:
        ' * @param onMessage callback when a message is received on this channel'
    }
  ];

  const code = `/**
 * WebSocket server-side function to handle messages for \`${topic}\`
 *
${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(',\n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(',\n  ')}
}): void {
  const channelPattern = ${regexPattern};
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          ${parameterExtraction}
          onConnection({${channelParameters ? '\n            parameters,' : ''}
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = ${messageUnmarshalling};
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [
      `import * as WebSocket from 'ws';`,
      `import { IncomingMessage } from 'http';`
    ],
    functionType: ChannelFunctionTypes.WEBSOCKET_REGISTER
  };
}
