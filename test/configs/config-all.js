/* eslint-disable sonarjs/no-duplicate-string */
/** @type {import("@alagoni97/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/',
			serializationType: 'json', 
			language: 'typescript'
		},
		{
			preset: 'parameters',
			outputPath: './src/__gen__/',
			serializationType: 'json', 
			language: 'typescript'
		},
		{
			preset: 'channels',
			outputPath: './src/__gen__/', 
			language: 'typescript',
			protocols: ['nats']
		}
	]
};
