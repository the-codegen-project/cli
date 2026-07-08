/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-3.json',
	language: 'typescript',
	generators: [
		{
			preset: 'channels',
			outputPath: './src/openapi-tag-organization/channels',
			protocols: ['http_client'],
			organization: 'tag'
		}
	]
};
