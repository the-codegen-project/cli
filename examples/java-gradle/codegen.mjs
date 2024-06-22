/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'java',
	generators: [
		{
			preset: 'payloads',
			language: 'java',
			outputPath: 'app/src/main/resources/generated-source/the/codegen/project',
			packageName: 'the.codegen.project',
			serializationType: 'json', 
		}
	]
};
