/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-recursive.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/recursive/payloads',
			serializationType: 'json',
		}
	]
};
