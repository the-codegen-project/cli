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
  TypeScriptParameterRenderType,
  TypescriptHeadersContext,
  TypescriptHeadersGenerator,
  defaultTypeScriptHeadersOptions,
  generateTypescriptHeaders,
  TypescriptHeadersGeneratorInternal,
  TypescriptTypesContext,
  TypescriptTypesGenerator,
  TypescriptTypesGeneratorInternal,
  defaultTypeScriptTypesOptions,
  generateTypescriptTypes,
  ChannelFunctionTypes
} from './typescript';
export {
  defaultCustomGenerator,
  CustomGenerator,
  CustomGeneratorInternal,
  CustomContext
} from './generic/custom';
import {GenerationResult, RunGeneratorContext} from '../types';
import {determineRenderGraph, renderGraph} from '../renderer';
import {realizeGeneratorContext} from '../configurations';

/**
 * Function that runs the given generator context ensuring the generators are rendered in the correct order.
 */
export async function runGenerators(
  context: RunGeneratorContext
): Promise<GenerationResult> {
  const graph = determineRenderGraph(context);
  return renderGraph(context, graph);
}

/**
 * Load the configuration and run the generator
 *
 * @param configFileOrContext Either a config file path or a pre-realized RunGeneratorContext
 * @returns Generation result with file tracking information
 */
export async function generateWithConfig(
  configFileOrContext: string | undefined | RunGeneratorContext
): Promise<GenerationResult> {
  const context =
    typeof configFileOrContext === 'string' || configFileOrContext === undefined
      ? await realizeGeneratorContext(configFileOrContext)
      : configFileOrContext;
  return runGenerators(context);
}
