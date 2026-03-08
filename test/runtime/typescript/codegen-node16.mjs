/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-regular.json',
	language: 'typescript',
	importExtension: '.ts', // Required for moduleResolution: "node16" / "nodenext"
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/node16/payloads',
			serializationType: 'json'
		},
		{
			preset: 'parameters',
			outputPath: './src/node16/parameters'
		},
		{
			preset: 'headers',
			outputPath: './src/node16/headers'
		},
		{
			preset: 'channels',
			outputPath: './src/node16/channels',
			protocols: ['nats']
		}
	]
};
