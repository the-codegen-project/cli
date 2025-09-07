/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {findRegexFromChannel, pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderExpress({
  topic,
  messageType,
  messageModule,
  channelParameters,
  channelHeaders,
  subName = pascalCase(topic),
  functionName = `register${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  let addressToUse = topic.replace(/{([^}]+)}/g, ':$1');
  addressToUse = addressToUse.startsWith('/')
    ? addressToUse
    : `/${addressToUse}`;
  let messageMarshalling = 'message.marshal()';
  if (messageModule) {
    messageMarshalling = `${messageModule}.marshal(message)`;
  }
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const callbackFunctionParameters = [
    {
      parameter: 'req: Request',
      jsDoc: ' * @param req from the request'
    },
    {
      parameter: 'res: Response',
      jsDoc: ' * @param res from the request'
    },
    {
      parameter: 'next: NextFunction',
      jsDoc: ' * @param next attached to the request'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters: ${channelParameters.type}`,
            jsDoc:
              ' * @param parameters that was received when client made the connection'
          }
        ]
      : []),
    {
      parameter: `sendEvent: (message: ${messageType}) => void`,
      jsDoc:
        ' * @param sendEvent callback you can use to send message to the client'
    }
  ];
  const functionParameters = [
    {
      parameter: 'router',
      parameterType: 'router: Router',
      jsDoc: ' * @param router to attach the event source to'
    },
    {
      parameter: `callback`,
      parameterType: `callback: ((${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void) | ((${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => Promise<void>)`,
      jsDoc: ' * @param callback to call when receiving events'
    }
  ];

  const code = `${functionName}: ({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}) => {
  const event = '${addressToUse}';
  router.get(event, async (req, res, next) => {
    ${channelParameters ? `const listenParameters = ${channelParameters.type}.createFromChannel(req.originalUrl.startsWith('/') ? req.originalUrl.slice(1) : req.originalUrl, '${topic}', ${findRegexFromChannel(topic)});` : ''}
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: ${messageType}) => {
      if (res.closed) {
        return
      }
      res.write(\`event: \${event}\\n\`)
      res.write(\`data: \${${messageMarshalling}}\\n\\n\`)
    }
    await callback(req, res, next, ${channelParameters ? 'listenParameters, ' : ' '}sendEventCallback)
  })
}
`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [
      `import { NextFunction, Request, Response, Router } from 'express';`
    ],
    functionType: ChannelFunctionTypes.EVENT_SOURCE_EXPRESS
  };
}
