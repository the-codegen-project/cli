import { TheCodegenConfiguration, LoadArgument } from "./types";
const supportsESM = require('supports-esm');

export async function loadConfigFile(loadArguments: LoadArgument): Promise<TheCodegenConfiguration> {
	const { configType } = loadArguments;
	if (configType === 'esm') {
		return loadEsmConfig(loadArguments);
	}
  throw new Error("Load configuration not found");
}

async function loadEsmConfig({configPath}: LoadArgument): Promise<TheCodegenConfiguration> {
  if (supportsESM) {
    try {
      const esmConfigFile = await import(`${configPath}`);
      if (esmConfigFile.default) {
        return esmConfigFile.default;
      }
  
      throw new Error('Remember to export with `default`');
    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  throw new Error('Cannot load ESM in the current setup');
}
