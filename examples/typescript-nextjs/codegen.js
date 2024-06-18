/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			serializationType: 'json',
			outputPath: './src/__gen__'
		}
	]
};
