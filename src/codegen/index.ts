import { RunGeneratorContext } from "./types";
import { determineRenderGraph, renderGraph } from "./render-graph";

export async function runGenerators(context: RunGeneratorContext) {
  const graph = determineRenderGraph(context);
  return renderGraph(context, graph);
}
