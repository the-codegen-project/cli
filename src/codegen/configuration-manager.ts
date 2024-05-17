import { CodegenConfiguration, Generators, GenericCodegenContext, LoadArgument, SupportedLanguages } from "./types.js";

export async function loadConfigFile(loadArguments: LoadArgument): Promise<CodegenConfiguration> {
	const { configType } = loadArguments;
	if(configType === 'esm') {
		return loadEsmConfig(loadArguments)
	} else {
		throw new Error("Load configuration not found")
	}
}

async function loadEsmConfig({configPath}: LoadArgument): Promise<CodegenConfiguration> {
	try {
		const esmConfigFile = await import(`file://${configPath}`);
		if(esmConfigFile.default) {
			return esmConfigFile.default;
		}
		return Promise.reject('Remember to export with `default`');
	} catch (error) {
		return Promise.reject(error);
	}
}
