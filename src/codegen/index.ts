import { RunGeneratorContext } from "./types.js";
import { determineRenderGraph, renderGraph } from "./renderGraph.js";

export async function runGenerators(context: RunGeneratorContext) {
  const graph = determineRenderGraph(context)
  return renderGraph(context, graph)
}