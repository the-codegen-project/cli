import {RunGeneratorContext} from './types';
import {determineRenderGraph, renderGraph} from './renderer';

/**
 * Function that runs the given generator context ensuring the generators are rendered in the correct order.
 */
export async function runGenerators(context: RunGeneratorContext) {
  const graph = determineRenderGraph(context);
  return renderGraph(context, graph);
}
export {loadAsyncapi} from './inputs/asyncapi';

export {
  defaultTypeScriptChannelsGenerator,
  defaultTypeScriptParametersOptions,
  defaultTypeScriptPayloadGenerator,
  defaultTypeScriptClientGenerator,
  defaultCustomGenerator,
  TypeScriptClientGenerator,
  TypeScriptChannelsGenerator,
  TypeScriptPayloadGenerator,
  TypescriptParametersGenerator,
  generateTypeScriptChannels,
  generateTypescriptParameters,
  generateTypescriptPayload,
  generateWithConfig
} from './generators';

export {
  RunGeneratorContext,
  SupportedLanguages,
  PresetTypes,
  TheCodegenConfiguration,
  TheCodegenConfigurationInternal,
  zodAsyncAPICodegenConfiguration,
  zodAsyncAPIGenerators,
  zodAsyncAPITypeScriptGenerators,
  zodTheCodegenConfiguration,
  Generators,
  GenericCodegenContext,
  LoadArgument,
  ParameterRenderType,
  PayloadRenderType,
  SingleFunctionRenderType
} from './types';

export {getDefaultConfiguration, realizedConfiguration} from './configurations';

export {renderGenerator} from './renderer';
