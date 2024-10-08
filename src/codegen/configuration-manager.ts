import {
  TheCodegenConfiguration,
  zodTheCodegenConfiguration,
  Generators,
  TheCodegenConfigurationInternal
} from './types';
import {getDefaultConfiguration} from './generators/index';
import {Logger} from '../LoggingInterface';
import {fromError} from 'zod-validation-error';
import {includeTypeScriptChannelDependencies} from './generators/typescript/channels';
import {mergePartialAndDefault} from './utils';
import {cosmiconfig} from 'cosmiconfig';
const moduleName = 'codegen';
const explorer = cosmiconfig(moduleName, {
  searchPlaces: [
    `${moduleName}.json`,
    `${moduleName}.yaml`,
    `${moduleName}.yml`,
    `${moduleName}.js`,
    `${moduleName}.ts`,
    `${moduleName}.mjs`,
    `${moduleName}.cjs`
  ],
  mergeSearchPlaces: true
});

export async function loadConfigFile(filePath?: string): Promise<{
  config: TheCodegenConfigurationInternal;
  filePath: string;
}> {
  let cosmiConfig: any;
  if (filePath) {
    cosmiConfig = await explorer.load(filePath);
  } else {
    cosmiConfig = await explorer.search();
  }
  let codegenConfig;
  if (!cosmiConfig) {
    throw new Error('Cannot find configuration...');
  }
  if (typeof cosmiConfig.config.default === 'function') {
    codegenConfig = cosmiConfig.config.default();
  } else if (typeof cosmiConfig.config.default === 'object') {
    codegenConfig = cosmiConfig.config.default;
  } else {
    codegenConfig = cosmiConfig.config;
  }
  const realizedConfiguration = realizeConfiguration(codegenConfig);
  return {
    config: realizedConfiguration,
    filePath: cosmiConfig.filepath
  };
}

/**
 * Ensure that each generator has the default options along side custom properties
 */
export function realizeConfiguration(
  config: TheCodegenConfiguration
): TheCodegenConfigurationInternal {
  config.generators = config.generators ?? [];

  const generatorIds: string[] = [];
  for (const [index, generator] of config.generators.entries()) {
    const language = (generator as any).language ?? config.language;
    if (!generator?.preset) {
      continue;
    }
    const defaultGenerator = getDefaultConfiguration(
      generator.preset,
      language
    );
    const generatorToUse = mergePartialAndDefault(defaultGenerator, generator);
    const oldId = generatorToUse.id;
    // Make sure that each generator has unique ids if they dont explicit define one
    if (generatorToUse.id === defaultGenerator.id) {
      const duplicateGenerators = generatorIds.filter(
        (generatorId) => generatorId === generatorToUse.id
      );
      if (duplicateGenerators.length > 0) {
        generatorToUse.id = `${generatorToUse.id}-${duplicateGenerators.length}`;
      }
    }
    generatorIds.push(oldId);

    // eslint-disable-next-line security/detect-object-injection
    config.generators[index] = generatorToUse as any;
  }
  try {
    zodTheCodegenConfiguration.parse(config);
  } catch (e) {
    const validationError = fromError(e);
    Logger.error(
      validationError
        .toString()
        .split('Validation error:')
        .join('\n')
        .split(';')
        .join('\n')
    );
    throw new Error(`Not a valid configuration file; ${validationError}`);
  }
  const newGenerators = ensureProperGenerators(
    config as TheCodegenConfiguration
  );
  config.generators.push(...(newGenerators as any));
  return config as TheCodegenConfigurationInternal;
}

/**
 * Ensure that all generators have their dependency default generators.
 *
 * For example, for typescript channels, include default payload and parameter generators if not explicitly sat.
 */
function ensureProperGenerators(config: TheCodegenConfiguration) {
  const newGenerators: Generators[] = [];
  for (const [_, generator] of config.generators.entries()) {
    const language = (generator as any).language ?? config.language;
    if (generator.preset === 'channels' && language === 'typescript') {
      newGenerators.push(
        ...includeTypeScriptChannelDependencies(config, generator)
      );
    }
  }
  return newGenerators;
}
