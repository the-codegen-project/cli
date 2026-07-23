/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'asyncapi',
	inputPath: '../asyncapi-regular.json',
	language: 'typescript',
	// Keep the string/array/union payload channels, then drop union again via
	// exclude (exclude wins over include). Every other channel — and therefore
	// its payload model — is left out entirely, exercising orphan pruning.
	filter: {
		include: ['string/payload', 'array/payload', 'union/payload'],
		exclude: ['union/payload']
	},
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/asyncapi-filter/payloads',
			serializationType: 'json'
		}
	]
};
