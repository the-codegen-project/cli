export interface LoadArgument {configPath: string, configType: 'cjs' | 'esm'}

export async function loadConfigFile(loadArguments: LoadArgument) {
	const { configType } = loadArguments;
	if(configType === 'cjs') {
		return loadCjsConfig(loadArguments)
	} else if(configType === 'esm') {
		return loadEsmConfig(loadArguments)
	} else {
		throw new Error("Load configuration not found")
	}
}

async function loadCjsConfig({configPath, configType}: LoadArgument) {
	const cjsConfigFile = require(configPath);
}
async function loadEsmConfig({configPath, configType}: LoadArgument) {
	try {
		const esmConfigFile = await import(configPath);
		esmConfigFile.
	} catch (error) {
		
	}
}

function validateConfigFile(config: any) {

}