import {
  TheCodegenConfiguration,
  LoadArgument,
  zodTheCodegenConfiguration
} from './types';
import {getDefaultConfiguration} from './generators/index';
import path from 'node:path';
import yaml from 'yaml';
import fs from 'fs';
import {Logger} from '../LoggingInterface';
import {fromError} from 'zod-validation-error';
import {includeTypeScriptChannelDependencies} from './generators/typescript/channels';
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const supportsESM = require('supports-esm');

export async function loadConfigFile(
  loadArguments: LoadArgument
): Promise<TheCodegenConfiguration> {
  const {configType} = loadArguments;
  if (configType === 'esm') {
    return loadEsmConfig(loadArguments);
  } else if (configType === 'json') {
    return loadJsonConfig(loadArguments);
  } else if (configType === 'yaml') {
    return loadYamlConfig(loadArguments);
  }
  throw new Error('Load configuration not found');
}

async function loadJsonConfig({
  configPath
}: LoadArgument): Promise<TheCodegenConfiguration> {
  const stringConfigFile = await fs.promises.readFile(configPath, 'utf8');
  if (stringConfigFile) {
    const config = JSON.parse(stringConfigFile);
    return realizeConfiguration(config);
  }

  throw new Error('Could not load JSON configuration file, nothing to read');
}

async function loadYamlConfig({
  configPath
}: LoadArgument): Promise<TheCodegenConfiguration> {
  const stringConfigFile = await fs.promises.readFile(configPath, 'utf8');
  if (stringConfigFile) {
    const config = yaml.parse(stringConfigFile);
    return realizeConfiguration(config);
  }

  throw new Error('Could not load YAML configuration file, nothing to read');
}

async function loadEsmConfig({
  configPath
}: LoadArgument): Promise<TheCodegenConfiguration> {
  if (supportsESM) {
    const esmConfigFile = await import(`${configPath}`);
    if (esmConfigFile.default) {
      return realizeConfiguration(esmConfigFile.default);
    }

    throw new Error('Remember to export with `default`');
  }

  throw new Error('Cannot load ESM in the current setup');
}

/**
 * Ensure that each generator has the default options along side custom properties
 */
export function realizeConfiguration(
  config: TheCodegenConfiguration
): TheCodegenConfiguration {
  for (const [index, generator] of config.generators.entries()) {
    const language = (generator as any).language ?? config.language;
    const defaultGenerator = getDefaultConfiguration(
      generator.preset,
      language
    );
    let generatorToUse = generator;
    if (defaultGenerator) {
      generatorToUse = {...defaultGenerator, ...generator};
    }
    // eslint-disable-next-line security/detect-object-injection
    config.generators[index] = generatorToUse;
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
  const newGenerators = ensureProperGenerators(config);
  config.generators.push(...newGenerators);
  return config;
}

/**
 * Ensure that all generators have their dependency default generators.
 *
 * For example, for typescript channels, include default payload and parameter generators if not explicitly sat.
 */
function ensureProperGenerators(config: TheCodegenConfiguration) {
  const newGenerators: any[] = [];
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

async function checkFileExists(configFileLoad: LoadArgument) {
  const {configPath, configType} = configFileLoad;
  // eslint-disable-next-line no-undef
  const processCwd = process.cwd();
  const filePath = path.resolve(processCwd, configPath);
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return {exists: true, configPath: filePath, configType};
  } catch {
    return {exists: false, configPath: filePath, configType};
  }
}

export async function discoverConfiguration(
  filePath?: string
): Promise<LoadArgument> {
  if (filePath) {
    // eslint-disable-next-line no-undef
    const fullConfigPath = path.resolve(process.cwd(), filePath);
    const extension = path.extname(fullConfigPath);
    if (extension === '.json') {
      return {configPath: fullConfigPath, configType: 'json'};
    } else if (extension === '.yaml' || extension === '.yml') {
      return {configPath: fullConfigPath, configType: 'yaml'};
    } else if (extension === '.mjs' || extension === '.js') {
      return {configPath: fullConfigPath, configType: 'esm'};
    }
    Logger.warn(
      `Could figure out the right configuration format, trying to use esm configuration for ${fullConfigPath}, which had extension ${extension}`
    );
    return {configPath: fullConfigPath, configType: 'esm'};
  }
  const result = (
    await Promise.all([
      checkFileExists({configPath: 'codegen.mjs', configType: 'esm'}),
      checkFileExists({configPath: 'codegen.js', configType: 'esm'}),
      checkFileExists({configPath: 'codegen.json', configType: 'json'}),
      checkFileExists({configPath: 'codegen.yaml', configType: 'yaml'}),
      checkFileExists({configPath: 'codegen.yml', configType: 'yaml'})
    ])
  ).find((entry) => entry.exists === true);
  if (result === undefined) {
    throw new Error(
      'Could not find configurations on default paths, please provide one'
    );
  } else {
    return result;
  }
}
