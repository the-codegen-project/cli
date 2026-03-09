/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-3.json',
	language: 'typescript',
	// Jest/SWC handles module resolution without file extensions
	importExtension: 'none',
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
		},
		{
			preset: 'types',
			outputPath: './src/openapi',
		},
		{
			preset: 'channels',
			outputPath: './src/openapi/channels',
			protocols: ['http_client']
		}
	]
};
