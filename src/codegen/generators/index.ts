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
  JavaPayloadGenerator,
  generateJavaPayload,
  defaultJavaPayloadGenerator
} from './java/payloads';
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
import {defaultCustomGenerator} from './generic/custom';
import { CsharpPayloadGenerator, generateCsharpPayload } from './csharp';

export {
  TypeScriptChannelsGenerator,
  generateTypeScriptChannels,
  defaultTypeScriptChannelsGenerator,
  TypeScriptPayloadGenerator,
  generateTypescriptPayload,
  defaultTypeScriptPayloadGenerator,
  TypescriptParametersGenerator,
  generateTypescriptParameters,
  defaultTypeScriptParametersOptions
};

export {JavaPayloadGenerator, generateJavaPayload, defaultJavaPayloadGenerator};

export async function renderGenerator(
  generator: Generators,
  context: RunGeneratorContext,
  renderedContext: Record<any, any>
) {
  const {configuration, documentPath, asyncapiDocument, configFilePath} =
    context;
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
              ...(generator as TypeScriptPayloadGenerator),
              outputPath
            },
            inputType: configuration.inputType,
            dependencyOutputs: renderedContext
          });
        }

        case 'java': {
          return generateJavaPayload({
            asyncapiDocument,
            generator: {
              ...generator,
              outputPath
            } as JavaPayloadGenerator,
            inputType: configuration.inputType,
            dependencyOutputs: renderedContext
          });
        }

        case 'csharp': {
          return generateCsharpPayload({
            asyncapiDocument,
            generator: {
              ...generator,
              outputPath
            } as CsharpPayloadGenerator,
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
            } as TypescriptParametersGenerator,
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
            } as TypeScriptChannelsGenerator,
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
        case 'java':
          return defaultJavaPayloadGenerator;
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
