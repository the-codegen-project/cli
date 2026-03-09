/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-payload-types.json',
	language: 'typescript',
	// Jest/SWC handles module resolution without file extensions
	importExtension: 'none',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/payload-types/payloads',
			serializationType: 'json',
		},
		{
			preset: 'types',
			outputPath: './src/payload-types',
		}
	]
};
