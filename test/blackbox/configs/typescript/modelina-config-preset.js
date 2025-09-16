import { modelina } from '@the-codegen-project/cli';
const { TS_COMMON_PRESET } = modelina;
/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} TheCodegenConfiguration **/
export default {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'models',
			renderers: [
				{
					preset: TS_COMMON_PRESET,
					options: {
						marshalling: true
					}
				}
			],
			outputPath: './models'
		}
	]
};
