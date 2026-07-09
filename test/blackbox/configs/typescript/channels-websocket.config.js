/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
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
			protocols: ['websocket']
		}
	]
};
