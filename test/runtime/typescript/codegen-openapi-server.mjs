/**
 * Generates BOTH HTTP protocols from the same OpenAPI document.
 *
 * Generating them together is deliberate: it proves the two protocol files
 * coexist, that the shared `HttpError` name does not collide across files, and
 * that the `deserialize*Headers` import added to `http_client.ts` type-checks.
 *
 * @type {import("../../../dist").TheCodegenConfiguration}
 **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-3.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/openapi-server/payloads',
			serializationType: 'json',
			// Explicit (matches the default) so the request-validation path is
			// always exercised by the runtime spec.
			includeValidation: true,
		},
		{
			preset: 'parameters',
			outputPath: './src/openapi-server/parameters',
		},
		{
			preset: 'headers',
			outputPath: './src/openapi-server/headers',
		},
		{
			preset: 'channels',
			outputPath: './src/openapi-server/channels',
			protocols: ['http_client', 'http_server']
		}
	]
};
