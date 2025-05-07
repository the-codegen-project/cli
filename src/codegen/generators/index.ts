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
export {defaultCustomGenerator, CustomGenerator} from './generic/custom';
import {RunGeneratorContext} from '../types';
import {determineRenderGraph, renderGraph} from '../renderer';
import {realizeGeneratorContext} from '../configurations';

/**
 * Function that runs the given generator context ensuring the generators are rendered in the correct order.
 */
export async function runGenerators(context: RunGeneratorContext) {
  const graph = determineRenderGraph(context);
  return renderGraph(context, graph);
}

/**
 * Load the configuration and run the generator
 *
 * @param configFile
 */
export async function generateWithConfig(configFile: string | undefined) {
  const context = await realizeGeneratorContext(configFile);
  await runGenerators(context);
}
