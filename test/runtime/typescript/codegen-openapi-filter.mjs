/** @type {import("../../../dist").TheCodegenConfiguration} **/
export default {
	inputType: 'openapi',
	inputPath: '../openapi-filter.json',
	language: 'typescript',
	// Keep only the /users path. The /orders operation is dropped, and the Order
	// schema — referenced solely by that dropped operation — must be pruned as an
	// orphan. User (kept) and Address (referenced by the kept User) survive.
	filter: {
		include: ['/users']
	},
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/openapi-filter/payloads',
			serializationType: 'json'
		}
	]
};
