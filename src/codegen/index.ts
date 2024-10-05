import {RunGeneratorContext} from './types';
import {determineRenderGraph, renderGraph} from './render-graph';

/**
 * Function that runs the given generator context ensuring the generators are rendered in the correct order.
 */
export async function runGenerators(context: RunGeneratorContext) {
  const graph = determineRenderGraph(context);
  return renderGraph(context, graph);
}
