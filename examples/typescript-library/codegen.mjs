/** @type {import("../../dist/index").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/payload',
			serializationType: 'json'
		},
		{
			preset: 'parameters',
			outputPath: './src/__gen__/parameters',
			serializationType: 'json'
		},
		{
			preset: 'channels',
			protocols: ['nats'],
			outputPath: './src/__gen__/',
		}
	]
};
