import {
  TheCodegenConfiguration,
  zodTheCodegenConfiguration,
  Generators,
  TheCodegenConfigurationInternal,
  RunGeneratorContext,
  PresetTypes,
  SupportedLanguages,
  GeneratorsInternal
} from './types';
import {
  defaultCustomGenerator,
  defaultTypeScriptParametersOptions,
  defaultTypeScriptPayloadGenerator
} from './generators';
import {Logger} from '../LoggingInterface';
import {fromError} from 'zod-validation-error';
import {
  defaultTypeScriptChannelsGenerator,
  includeTypeScriptChannelDependencies
} from './generators/typescript/channels';
import {mergePartialAndDefault} from './utils';
import {cosmiconfig} from 'cosmiconfig';
import {
  defaultTypeScriptClientGenerator,
  includeTypeScriptClientDependencies
} from './generators/typescript/client';
import path from 'path';
import {loadAsyncapi} from './inputs/asyncapi';
import {loadOpenapi} from './inputs/openapi';
import {loadJsonSchema} from './inputs/jsonschema';
import {
  defaultTypeScriptHeadersOptions,
  defaultTypeScriptTypesOptions
} from './generators/typescript';
import {defaultTypeScriptModelsOptions} from './generators/typescript/models';
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

/**
 * Load configuration from file.
 */
export async function loadConfigFile(filePath?: string): Promise<{
  config: TheCodegenConfiguration;
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
    if (filePath) {
      throw new Error(`Cannot find configuration at path: ${filePath}`);
    } else {
      throw new Error(
        `Cannot find configuration file. Searched in the following locations:\n` +
          `  - codegen.json\n` +
          `  - codegen.yaml\n` +
          `  - codegen.yml\n` +
          `  - codegen.js\n` +
          `  - codegen.ts\n` +
          `  - codegen.mjs\n` +
          `  - codegen.cjs\n` +
          `Please create a configuration file or specify a path using --config`
      );
    }
  }
  if (typeof cosmiConfig.config.default === 'function') {
    codegenConfig = cosmiConfig.config.default();
  } else if (typeof cosmiConfig.config.default === 'object') {
    codegenConfig = cosmiConfig.config.default;
  } else {
    codegenConfig = cosmiConfig.config;
  }
  return {
    config: codegenConfig,
    filePath: cosmiConfig.filepath
  };
}

/**
 * Load the configuration file and realize it with default options if necessary.
 */
export async function loadAndRealizeConfigFile(filePath?: string): Promise<{
  config: TheCodegenConfigurationInternal;
  filePath: string;
}> {
  const codegenConfig = await loadConfigFile(filePath);
  const realizedConfiguration = realizeConfiguration(codegenConfig.config);
  return {
    config: realizedConfiguration,
    filePath: codegenConfig.filePath
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
    const language =
      (generator as any).language !== undefined
        ? (generator as any).language
        : config.language ?? 'typescript';
    if (!generator?.preset) {
      continue;
    }
    const defaultGenerator = getDefaultConfiguration(
      generator.preset,
      language
    );
    if (!defaultGenerator) {
      throw new Error('Unable to determine default generator');
    }
    const generatorToUse = mergePartialAndDefault(
      defaultGenerator,
      generator as any
    ) as GeneratorsInternal;
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
    throw new Error(`Invalid configuration file; ${validationError}`);
  }
  const newGenerators = ensureProperGenerators(config);
  config.generators.push(...(newGenerators as any));
  return config as TheCodegenConfigurationInternal;
}

/**
 * Ensure that all generators have their dependency default generators.
 *
 * For example, for typescript channels, include default payload and parameter generators if not explicitly sat.
 *
 * This is done recursively.
 */
function ensureProperGenerators(config: TheCodegenConfiguration) {
  const iterateGenerators = (generators: Generators[]) => {
    const newGenerators: Generators[] = [];
    for (const generator of generators) {
      const language = (generator as any).language ?? config.language;
      if (generator.preset === 'channels' && language === 'typescript') {
        newGenerators.push(
          ...includeTypeScriptChannelDependencies(config, generator)
        );
      }
      if (generator.preset === 'client' && language === 'typescript') {
        newGenerators.push(
          ...includeTypeScriptClientDependencies(config, generator)
        );
      }
    }
    if (newGenerators.length > 0) {
      newGenerators.push(...iterateGenerators(newGenerators));
    }
    return newGenerators;
  };

  return iterateGenerators(Array.from(config.generators.values()));
}

/**
 * Returns the default generator for the preset of the language
 */
export function getDefaultConfiguration(
  preset: PresetTypes,
  language: SupportedLanguages
): GeneratorsInternal | undefined {
  switch (preset) {
    case 'payloads':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptPayloadGenerator;
      }
      break;
    case 'headers':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptHeadersOptions;
      }
      break;
    case 'types':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptTypesOptions;
      }
      break;
    case 'models':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptModelsOptions;
      }
      break;
    case 'channels':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptChannelsGenerator;
      }
      break;
    case 'client':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptClientGenerator;
      }
      break;
    case 'custom':
      return defaultCustomGenerator;
    case 'parameters':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptParametersOptions;
      }
      break;
  }
  return undefined;
}

/**
 * Load configuration and input document to create generator context
 *
 * @param configFile
 */
export async function realizeGeneratorContext(
  configFile: string | undefined
): Promise<RunGeneratorContext> {
  const {config, filePath} = await loadAndRealizeConfigFile(configFile);
  Logger.info(`Found configuration was ${JSON.stringify(config)}`);
  const documentPath = path.resolve(path.dirname(filePath), config.inputPath);
  Logger.info(`Found document at '${documentPath}'`);
  Logger.info(`Found input '${config.inputType}'`);
  const context: RunGeneratorContext = {
    configuration: config,
    documentPath,
    configFilePath: filePath
  };
  if (config.inputType === 'asyncapi') {
    const document = await loadAsyncapi(context);
    context.asyncapiDocument = document;
  } else if (config.inputType === 'openapi') {
    const document = await loadOpenapi(context);
    context.openapiDocument = document;
  } else if (config.inputType === 'jsonschema') {
    const document = await loadJsonSchema(context);
    context.jsonSchemaDocument = document;
  }

  return context;
}
