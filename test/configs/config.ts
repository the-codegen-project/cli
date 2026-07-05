import {TheCodegenConfiguration} from '@alagoni97/cli';

const config: TheCodegenConfiguration = {
	inputType: 'asyncapi',
	inputPath: 'asyncapi.json',
	language: 'typescript',
	generators: [
		{
			preset: 'payloads',
			outputPath: './src/__gen__/',
			// Not needed, as we can look in the AsyncAPI file, but we can overwrite it
			serializationType: 'json',
		},
	]
};

export default config;
