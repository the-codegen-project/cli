/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-3.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/openapi/payloads',
			serializationType: 'json', 
		},
		{
			preset: 'parameters',
			outputPath: './src/openapi/parameters',
		},
		{
			preset: 'headers',
			outputPath: './src/openapi/headers',
		}
	]
};
