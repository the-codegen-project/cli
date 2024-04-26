/** @type {import("../../dist/index").CodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	language: 'java',
	generators: [
		{
			preset: 'payloads',
			outputPath: './target/generated-sources/the-codegen-project/com/mycompany/java/maven',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
			packageName: 'com.mycompany.java.maven',
			language: 'java'
		}
	]
}