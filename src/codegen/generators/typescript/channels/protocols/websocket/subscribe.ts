/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable sonarjs/no-duplicate-string */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderWebSocketSubscribe({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `subscribeTo${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  let messageUnmarshalling = `${messageType}.unmarshal(receivedData)`;
  if (messageModule) {
    messageUnmarshalling = `${messageModule}.unmarshal(receivedData)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const callbackParameters = [
    'err?: Error',
    `msg?: ${messageType}`,
    ...(channelParameters ? [`parameters?: ${channelParameters.type}`] : []),
    'ws?: WebSocket.WebSocket'
  ];

  const callbackArguments = [
    'err: undefined',
    'msg: parsedMessage',
    ...(channelParameters ? ['parameters'] : []),
    'ws'
  ];

  const errorCallbackArguments = [
    'err: new Error(`Failed to parse message: ${error.message}`)',
    'msg: undefined',
    ...(channelParameters ? ['parameters'] : []),
    'ws'
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback`,
      parameterType: `onDataCallback: (params: {${callbackParameters.join(', ')}}) => void`,
      jsDoc: ' * @param onDataCallback callback when messages are received'
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
      jsDoc:
        ' * @param ws the WebSocket connection (assumed to be already connected)'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  const code = `/**
 * WebSocket client-side function to subscribe to messages from \`${topic}\`
 *
${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(',\n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(',\n  ')}
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,${channelParameters ? '\n        parameters,' : ''}
        ws
      });
      return;
    }

    const validator = ${messageModule ? `${messageModule}.createValidator()` : `${messageType}.createValidator()`};

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = ${messageUnmarshalling};
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = ${messageModule ? `${messageModule}.marshal(parsedMessage)` : `parsedMessage.marshal()`};
          const {valid, errors} = ${messageModule ? `${messageModule}.validate({data: messageToValidate, ajvValidatorFunction: validator})` : `${messageType}.validate({data: messageToValidate, ajvValidatorFunction: validator})`};
          if (!valid) {
            onDataCallback({
              err: new Error(\`Invalid message payload received; \${JSON.stringify({cause: errors})}\`),
              msg: undefined,${channelParameters ? '\n              parameters,' : ''}
              ws
            });
            return;
          }
        }

        onDataCallback({
          ${callbackArguments.join(',\n          ')}
        });

      } catch (error: any) {
        onDataCallback({
          ${errorCallbackArguments.join(',\n          ')}
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(\`WebSocket error: \${error.message}\`),
        msg: undefined,${channelParameters ? '\n        parameters,' : ''}
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(\`WebSocket closed unexpectedly: \${code} \${reason.toString()}\`),
          msg: undefined,${channelParameters ? '\n          parameters,' : ''}
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(\`Failed to set up WebSocket subscription: \${error.message}\`),
      msg: undefined,${channelParameters ? '\n      parameters,' : ''}
      ws
    });
  }
}`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [`import * as WebSocket from 'ws';`],
    functionType: ChannelFunctionTypes.WEBSOCKET_SUBSCRIBE
  };
}
