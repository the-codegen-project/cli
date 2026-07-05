/** @type {import("@alagoni97/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'models',
			renderers: [
				{
					class: {
						self: ({model}) => `class ${model.name} {}`
					},
					interface: {
						self: ({model}) => `interface ${model.name} {}`
					},
					type: {
						self: ({model}) => `type ${model.name} = string;`
					}
				}
			],
			outputPath: './models'
		}
	]
};
