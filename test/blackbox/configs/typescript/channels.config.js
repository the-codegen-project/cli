/** @type {import("@alagoni97/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './payload',
			serializationType: 'json', 
		},
		{
			preset: 'parameters',
			outputPath: './parameters',
			serializationType: 'json'
		},
		{
			preset: 'channels',
			outputPath: './',
			protocols: ['nats']
		}
	]
};
