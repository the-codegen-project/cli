/** @type {import("../../dist/index").CodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
			language: 'typescript'
		}
	]
}