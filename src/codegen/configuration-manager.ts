import { TheCodegenConfiguration, LoadArgument } from "./types";
import { getDefaultConfiguration } from './generators/index';
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
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
        return realizeConfiguration(esmConfigFile.default);
      }
  
      throw new Error('Remember to export with `default`');
    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  throw new Error('Cannot load ESM in the current setup');
}

/**
 * Ensure that each generator has the default options along side custom properties
 */
export function realizeConfiguration(config: TheCodegenConfiguration): TheCodegenConfiguration {
  for (const [index, generator] of config.generators.entries()) {
    const language = (generator as any).language ?? config.language;
    const defaultGenerator = getDefaultConfiguration(generator.preset, language);
    let generatorToUse: any;
    if (defaultGenerator) {
      generatorToUse = {...defaultGenerator, ...generator};
    }
    // eslint-disable-next-line security/detect-object-injection
    config.generators[index] = generatorToUse;
  }
  return config;
}