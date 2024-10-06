/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'parameters',
			outputPath: '../../output/parameters',
			serializationType: 'json'
		}
	]
};
