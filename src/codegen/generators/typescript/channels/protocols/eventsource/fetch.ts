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
  channelHeaders,
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
      onValidationFail: `return callback({error: new Error(\`Invalid message payload received; $\{JSON.stringify({cause: errors})}\`), messageEvent: undefined});`
    });
  const functionParameters = [
    {
      parameter: `callback`,
      parameterType: `callback: (params: {error?: Error, messageEvent?: ${messageType}}) => void`,
      jsDoc: ' * @param callback to call when receiving events'
    },
    ...(channelParameters
      ? [
          {
            parameter: `parameters`,
            parameterType: `parameters: ${channelParameters.type}`,
            jsDoc: ' * @param parameters for listening'
          }
        ]
      : []),
    ...(channelHeaders
      ? [
          {
            parameter: `headers`,
            parameterType: `headers?: ${channelHeaders.type}`,
            jsDoc:
              ' * @param headers optional headers to include with the EventSource connection'
          }
        ]
      : []),
    {
      parameter: 'options',
      parameterType: `options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}`,
      jsDoc: ' * @param options additionally used to handle the event source'
    },
    {
      parameter: 'skipMessageValidation = false',
      parameterType: 'skipMessageValidation?: boolean',
      jsDoc:
        ' * @param skipMessageValidation turn off runtime validation of incoming messages'
    }
  ];

  const code = `/**
 * Event source fetch for \`${topic}\`
 *
 ${functionParameters.map((param) => param.jsDoc).join('\n')}
 * @returns A cleanup function to abort the connection
 */
function ${functionName}({
  ${functionParameters.map((param) => param.parameter).join(', \n  ')}
}: {
  ${functionParameters.map((param) => param.parameterType).join(', \n  ')}
}): (() => void) {
	const controller = new AbortController();
	let eventsUrl: string = ${addressToUse};
	const url = \`\${options.baseUrl}/\${eventsUrl}\`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = \`Bearer \${options?.authorization}\`;
  }
  ${
    channelHeaders
      ? `// Add headers from AsyncAPI specification if provided
  if (headers) {
    const asyncApiHeaderData = headers.marshal();
    const parsedAsyncApiHeaders = typeof asyncApiHeaderData === 'string' ? JSON.parse(asyncApiHeaderData) : asyncApiHeaderData;
    for (const [key, value] of Object.entries(parsedAsyncApiHeaders)) {
      if (value !== undefined) {
        requestHeaders[key] = String(value);
      }
    }
  }`
      : ''
  }
  ${potentialValidatorCreation}
	fetchEventSource(\`\${url}\`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      ${potentialValidationFunction}
      const callbackData = ${messageUnmarshalling};
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
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
