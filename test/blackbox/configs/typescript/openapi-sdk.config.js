// Exercises the `client` preset over OpenAPI: one API class per document, with
// the channels/payloads/parameters/headers generators auto-included.
/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'openapi',
	inputPath: 'openapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'client',
			outputPath: './client',
			protocols: ['http']
		}
	]
};
