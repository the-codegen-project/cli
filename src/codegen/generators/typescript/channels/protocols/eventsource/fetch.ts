/* eslint-disable sonarjs/no-nested-template-literals */
import {ChannelFunctionTypes} from '../..';
import {SingleFunctionRenderType} from '../../../../../types';
import {pascalCase} from '../../../utils';
import {
  defaultTypeScriptChannelsGenerator,
  RenderRegularParameters
} from '../../types';
import {getValidationFunctions} from '../../utils';

export function renderFetch({
  topic,
  messageType,
  messageModule,
  channelParameters,
  subName = pascalCase(topic),
  functionName = `listenFor${subName}`,
  additionalProperties = {
    fetchDependency: defaultTypeScriptChannelsGenerator.eventSourceDependency
  },
  payloadGenerator
}: RenderRegularParameters<{
  fetchDependency: string;
}>): SingleFunctionRenderType {
  const includeValidation = payloadGenerator.generator.includeValidation;
  const addressToUse = channelParameters
    ? `parameters.getChannelWithParameters('${topic}')`
    : `'${topic}'`;
  const messageUnmarshalling = `${messageModule ?? messageType}.unmarshal(receivedData)`;
  messageType = messageModule ? `${messageModule}.${messageType}` : messageType;

  const {potentialValidatorCreation, potentialValidationFunction} =
    getValidationFunctions({
      includeValidation,
      messageModule,
      messageType,
      onValidationFail: `return callback(callbackData, 'Invalid message payload received');`
    });
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
        'options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}',
      jsDoc: ' * @param options additionally used to handle the event source'
    }
  ];

  const code = `/**
 * Event source fetch for \`${topic}\`
 * 
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 */
${functionName}: async (
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
) => {
	let eventsUrl: string = ${addressToUse};
	const url = \`\${options.baseUrl}/\${eventsUrl}\`
  const headers: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    headers['authorization'] = \`Bearer \${options?.authorization}\`;
  }
  ${potentialValidatorCreation}
	await fetchEventSource(\`\${url}\`, {
		method: 'GET',
		headers,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      ${potentialValidationFunction}
      const callbackData = ${messageUnmarshalling};
			callback(callbackData, undefined);
		},
		onerror: (err) => {
			options.onClose?.(err);
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
      `import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '${additionalProperties.fetchDependency}';`
    ],
    functionType: ChannelFunctionTypes.EVENT_SOURCE_FETCH
  };
}
