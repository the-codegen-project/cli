/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-request-reply.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/request-reply/payloads',
			serializationType: 'json', 
		},
		{
			preset: 'parameters',
			outputPath: './src/request-reply/parameters',
		},
		{
			preset: 'headers',
			outputPath: './src/request-reply/headers',
		},
		{
			preset: 'channels',
			outputPath: './src/request-reply/channels',
			protocols: ['nats', 'http_client']
		},
		{
			preset: 'client',
			outputPath: './src/request-reply/client',
			protocols: ['nats']
		}
	],
	telemetry: {
		enabled: false
	}
};
