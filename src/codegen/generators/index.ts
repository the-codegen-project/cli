import {
  TypescriptParametersGenerator,
  generateTypescriptParameters,
  defaultTypeScriptParametersOptions,
  TypeScriptPayloadGenerator,
  generateTypescriptPayload,
  defaultTypeScriptPayloadGenerator,
  TypeScriptChannelsGenerator,
  generateTypeScriptChannels,
  defaultTypeScriptChannelsGenerator,
  TypeScriptClientGenerator,
  defaultTypeScriptClientGenerator,
  generateTypeScriptClient,
  TypeScriptChannelsContext,
  TypeScriptClientContext,
  TypeScriptPayloadContext,
  TypescriptParametersContext,
  TypeScriptPayloadGeneratorInternal,
  TypeScriptChannelsGeneratorInternal,
  TypeScriptClientGeneratorInternal,
  TypescriptParametersGeneratorInternal,
  TypeScriptparameterRenderType
} from './typescript';
import {defaultCustomGenerator, CustomGenerator} from './generic/custom';
import {realizedConfiguration} from '../configurations';
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
  TypeScriptClientGenerator,
  defaultTypeScriptClientGenerator,
  generateTypeScriptClient,
  CustomGenerator,
  defaultCustomGenerator,
  TypeScriptChannelsContext,
  TypeScriptClientContext,
  TypeScriptPayloadContext,
  TypescriptParametersContext,
  TypeScriptPayloadGeneratorInternal,
  TypeScriptChannelsGeneratorInternal,
  TypeScriptClientGeneratorInternal,
  TypescriptParametersGeneratorInternal,
  TypeScriptparameterRenderType
};

/**
 * Load the configuration and run the generator
 *
 * @param configFile
 */
export async function generateWithConfig(configFile: string | undefined) {
  const context = await realizedConfiguration(configFile);
  await runGenerators(context);
}
