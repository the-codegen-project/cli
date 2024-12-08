/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../../configs/asyncapi-request.yaml',
	language: 'typescript',
	generators: [
		{
			preset: 'channels',
			outputPath: './src-request/channels',
			protocols: ['nats']
		}
	]
};
