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
			preset: 'channels',
			outputPath: './src/channels',
			protocols: ['nats', 'mqtt']
		},
		{
			preset: 'client',
			outputPath: './src/client',
			protocols: ['nats']
		}
	]
};
