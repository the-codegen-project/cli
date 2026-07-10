/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-organization.json',
	language: 'typescript',
	generators: [
		{
			preset: 'channels',
			outputPath: './src/asyncapi-tag-organization/channels',
			protocols: ['nats'],
			organization: 'tag'
		}
	]
};
