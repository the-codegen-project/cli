/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-regular.json',
	language: 'typescript',
	generators: [
		{
			preset: 'channels',
			outputPath: './src/asyncapi-path-organization/channels',
			protocols: ['nats'],
			organization: 'path'
		}
	]
};
