/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
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
			preset: 'channels',
			outputPath: './src/channels',
			protocols: ['nats']
		}
	]
};
