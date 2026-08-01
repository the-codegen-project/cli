// Exercises the OpenAPI -> HTTP server path alongside the client, in one
// generation. Generating both protocols together is intentional: it type-checks
// the coexistence of two files that each declare their own `HttpError`, and
// proves the `deserialize*Headers` import added to `http_client.ts` still
// compiles.
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
			protocols: ['http_client', 'http_server']
		}
	]
};
