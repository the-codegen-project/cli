/** @type {import("../../dist/index").CodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/payloads',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
			language: 'typescript'
		},
		{
			preset: 'parameters',
			outputPath: './src/__gen__/parameters',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
			language: 'typescript'
		},
		{
			preset: 'channels',
			outputPath: './src/__gen__/channels',
			language: 'typescript'
		}
	]
}