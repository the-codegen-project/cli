export {
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
  TypeScriptparameterRenderType,
  TypescriptHeadersContext,
  TypescriptHeadersGenerator,
  defaultTypeScriptHeadersOptions,
  generateTypescriptHeaders
} from './typescript';
export {defaultCustomGenerator, CustomGenerator} from './generic/custom';
import {realizedConfiguration} from '../configurations';
import {runGenerators} from '..';

/**
 * Load the configuration and run the generator
 *
 * @param configFile
 */
export async function generateWithConfig(configFile: string | undefined) {
  const context = await realizedConfiguration(configFile);
  await runGenerators(context);
}
