/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-primitive.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/openapi-primitive/payloads',
			serializationType: 'json',
		},
		{
			preset: 'parameters',
			outputPath: './src/openapi-primitive/parameters',
		},
		{
			preset: 'headers',
			outputPath: './src/openapi-primitive/headers',
		},
		{
			preset: 'types',
			outputPath: './src/openapi-primitive',
		},
		{
			preset: 'channels',
			outputPath: './src/openapi-primitive/channels',
			protocols: ['http_client']
		}
	]
};
