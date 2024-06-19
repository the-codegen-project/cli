/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'java',
	generators: [
		{
			preset: 'payloads',
			language: 'java',
			outputPath: './target/generated-sources/the-codegen-project/com/mycompany/java/maven',
			packageName: 'com.mycompany.java.maven',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json', 
		}
	]
};
