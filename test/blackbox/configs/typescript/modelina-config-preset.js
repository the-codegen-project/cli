import { modelina } from '@alagoni97/cli';
const { TS_COMMON_PRESET } = modelina;
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
