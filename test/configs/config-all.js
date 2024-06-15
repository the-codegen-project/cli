/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
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
			preset: 'payloads',
			outputPath: './src/__gen__/',
			serializationType: 'json', 
			packageName: 'test',
			language: 'java'
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
