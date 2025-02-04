/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {RenderRegularParameters} from '../../types';

export function renderListenForEvent({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `listenFor${subName}`
}: RenderRegularParameters): SingleFunctionRenderType {
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  const messageUnmarshalling = `${messageModule ?? messageType}.unmarshal(ev.data)`;
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const functionParameters = [
    {
      parameter: `callback: (messageEvent: ${messageType} | null, error?: string) => void`,
      jsDoc: ' * @param callback to call when receiving events'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters: ${channelParameters.type}`,
            jsDoc: ' * @param parameters for listening'
          }
        ]
      : []),
    {
      parameter:
        'options: {authorization?: string, onClose?: () => void, baseUrl: string}',
      jsDoc: ' * @param options additionally used to handle the event source'
    }
  ];

  const code = `/**
 * Event source fetch for \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: (
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
) => {
	let eventsUrl: string = ${addressToUse};
	const url = \`\${options.baseUrl}/\${eventsUrl}\`
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  }
  if(options.authorization) {
    headers['authorization'] = \`Bearer \${options?.authorization}\`;
  }
	fetchEventSource(\`\${url}\`, {
		method: 'GET',
		headers,
		onmessage: (ev: EventSourceMessage) => {
      const callbackData = ${messageUnmarshalling};
			callback(callbackData, undefined);
		},
		onerror: () => {
			options.onClose?.();
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: { get: (arg0: string) => any }; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback(null, 'Client side error, could not open event connection')
			} else {
				callback(null, 'Unknown error, could not open event connection');
			}
		},
	})
}
`;

  return {
    messageType,
    code,
    functionName,
    dependencies: [
      `import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '@microsoft/fetch-event-source'; `
    ],
    functionType: ChannelFunctionTypes.KAFKA_PUBLISH
  };
}
