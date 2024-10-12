/* eslint-disable sonarjs/no-nested-switch */
import path from 'path';
import {
  Generators,
  PresetTypes,
  RunGeneratorContext,
  SupportedLanguages
} from '../types';
import {Logger} from '../../LoggingInterface';

import {
  TypescriptParametersGenerator,
  generateTypescriptParameters,
  defaultTypeScriptParametersOptions,
  TypeScriptPayloadGenerator,
  generateTypescriptPayload,
  defaultTypeScriptPayloadGenerator,
  TypeScriptChannelsGenerator,
  generateTypeScriptChannels,
  defaultTypeScriptChannelsGenerator
} from './typescript';
import {defaultCustomGenerator, CustomGenerator} from './generic/custom';
import {TypeScriptPayloadGeneratorInternal} from './typescript/payloads';
import {TypescriptParametersGeneratorInternal} from './typescript/parameters';
import {TypeScriptChannelsGeneratorInternal} from './typescript/channels';
import {loadConfigFile} from '../configuration-manager';
import {loadAsyncapi} from '../inputs/asyncapi';
import {runGenerators} from '..';

export {
  TypeScriptChannelsGenerator,
  generateTypeScriptChannels,
  defaultTypeScriptChannelsGenerator,
  TypeScriptPayloadGenerator,
  generateTypescriptPayload,
  defaultTypeScriptPayloadGenerator,
  TypescriptParametersGenerator,
  generateTypescriptParameters,
  defaultTypeScriptParametersOptions,
  CustomGenerator,
  defaultCustomGenerator
};

export async function renderGenerator(
  generator: Generators,
  context: RunGeneratorContext,
  renderedContext: Record<any, any>
) {
  const {configuration, asyncapiDocument, configFilePath} = context;
  const outputPath = path.resolve(
    path.dirname(configFilePath),
    (generator as any).outputPath
  );
  Logger.info(`Found output path for generator '${outputPath}'`);
  const language = (generator as any).language
    ? (generator as any).language
    : configuration.language;
  Logger.info(`Found language for generator '${language}'`);
  Logger.info(`Found preset for generator '${generator.preset}'`);
  switch (generator.preset) {
    case 'payloads': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptPayload({
            asyncapiDocument,
            generator: {
              ...(generator as TypeScriptPayloadGeneratorInternal),
              outputPath
            },
            inputType: configuration.inputType,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw new Error(
            'Unable to determine language generator for payloads preset'
          );
        }
      }
    }

    case 'parameters': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptParameters({
            generator: {
              ...generator,
              outputPath
            } as TypescriptParametersGeneratorInternal,
            inputType: configuration.inputType,
            asyncapiDocument,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw new Error(
            'Unable to determine language generator for parameters preset'
          );
        }
      }
    }

    case 'channels': {
      switch (language) {
        case 'typescript': {
          return generateTypeScriptChannels({
            asyncapiDocument,
            generator: {
              ...generator,
              outputPath
            } as TypeScriptChannelsGeneratorInternal,
            inputType: configuration.inputType,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw new Error(
            'Unable to determine language generator for channels preset'
          );
        }
      }
    }

    case 'custom': {
      return generator.renderFunction(
        {
          asyncapiDocument,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext,
          generator
        },
        generator.options
      );
    }
    // No default
  }
}

export function getDefaultConfiguration(
  preset: PresetTypes,
  language: SupportedLanguages
): any {
  switch (preset) {
    case 'payloads':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptPayloadGenerator;
        default:
          return undefined;
      }
    case 'channels':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptChannelsGenerator;
        default:
          return undefined;
      }
    case 'custom':
      return defaultCustomGenerator;
    case 'parameters':
      switch (language) {
        case 'typescript':
          return defaultTypeScriptParametersOptions;
        default:
          return undefined;
      }
    default:
      return undefined;
  }
}

/**
 * Load configuration and input document to create generator context
 *
 * @param configFile
 */
export async function realizedConfiguration(
  configFile: string | undefined
): Promise<RunGeneratorContext> {
  const {config, filePath} = await loadConfigFile(configFile);
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
  }

  return context;
}

/**
 * Load the configuration and run the generator
 *
 * @param configFile
 */
export async function generateWithConfig(configFile: string | undefined) {
  const context = await realizedConfiguration(configFile);
  await runGenerators(context);
}
