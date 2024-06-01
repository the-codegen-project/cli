/** @type {import("../../dist/index").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/payload',
			serializationType: 'json',
			modelinaConfig: {

			}
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
