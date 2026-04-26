/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'eventcatalog',
	inputPath: './eventcatalog',
	service: 'test-service',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/eventcatalog/payloads',
			serializationType: 'json',
		},
		{
			preset: 'channels',
			outputPath: './src/eventcatalog/channels',
			protocols: ['nats']
		},
		{
			preset: 'client',
			outputPath: './src/eventcatalog/client',
			protocols: ['nats']
		}
	]
};
