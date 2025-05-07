/** @type {import("../../../").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/payloads',
			serializationType: 'json', 
		},
		{
			preset: 'parameters',
			outputPath: './src/parameters',
		},
		{
			preset: 'headers',
			outputPath: './src/headers',
		},
		{
			preset: 'types',
			outputPath: './src',
		},
		{
			preset: 'channels',
			outputPath: './src/channels',
			eventSourceDependency: '@ai-zen/node-fetch-event-source',
			protocols: ['nats', 'kafka', 'mqtt', 'event_source', 'amqp']
		},
		{
			preset: 'client',
			outputPath: './src/client',
			protocols: ['nats']
		}
	]
};
