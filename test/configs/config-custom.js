/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: "asyncapi.json",
	generators: [
		{
			preset: 'custom',
			renderFunction: ({dependencyOutputs}) => {
				// eslint-disable-next-line no-console, no-undef
				console.log(dependencyOutputs['bar']);
			},
			dependencies: ['bar']
		},
		{
			preset: 'custom',
			id: 'bar',
			renderFunction: () => {
				return 'Hello World!';
			}
		}
	]
};
