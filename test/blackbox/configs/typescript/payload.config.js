/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: '../../output/payload',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
		}
	]
};
