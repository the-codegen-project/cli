/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi.json',
	language: 'java',
	generators: [
		{
			preset: 'payloads',
			outputPath: './target/generated-sources/java/the/codegen/project/payloads',
			packageName: 'the.codegen.project.payloads',
			serializationType: 'json', 
		}
	]
};
