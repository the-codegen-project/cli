// Exercises the OpenAPI -> HTTP client path: array-typed and primitive success
// responses, 204/202 responses with no body, a component schema named `Error`
// (which shadows the global in the generated module), path-item level shared
// parameters, and Swagger 2.0 host/basePath resolution.
/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'openapi',
	inputPath: 'openapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './payload',
			serializationType: 'json'
		},
		{
			preset: 'parameters',
			outputPath: './parameters',
			serializationType: 'json'
		},
		{
			preset: 'headers',
			outputPath: './headers'
		},
		{
			preset: 'channels',
			outputPath: './',
			protocols: ['http_client']
		}
	]
};
