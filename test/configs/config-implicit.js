/* eslint-disable sonarjs/no-duplicate-string */
/** @type {import("@alagoni97/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi-request.yaml',
	language: 'typescript',
	generators: [
		{
			preset: 'channels',
			outputPath: './src/__gen__/', 
			protocols: ['nats']
		}
	]
};
