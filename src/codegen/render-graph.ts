import { renderGenerator } from "./generators";
import { Generators, RunGeneratorContext } from "./types";
import Graph from 'graphology';

export type Node = {
  generator: Generators
}
type GraphType = Graph<Node>

export function determineRenderGraph(context: RunGeneratorContext): GraphType {
  const { configuration } = context;
  const graph = new Graph<Node>({allowSelfLoops: true, type: 'directed'});
  for (const generator of (configuration.generators as Generators[])) {
    graph.addNode(generator.id, {generator});
  }
  for (const generator of (configuration.generators as Generators[])) {
    for (const dependency of generator.dependencies ?? []) {
      graph.addDirectedEdge(dependency, generator.id);
    }
  }
  
  if (graph.selfLoopCount !== 0) {
    throw new Error("You are not allowed to have self dependant generators");
  }

  return graph;
}

/**
 * Recursively go over all nodes and render those that are ready to be rendered (no dependencies that have not been rendered) and recursively do it until no nodes are left
 */
export async function renderGraph(context: RunGeneratorContext, graph: GraphType) {
  const renderedContext: any = {};
  const recursivelyRenderGenerators = async (nodesToRender: any[], previousCount?: number) => {
    const count = nodesToRender.length;
    if (previousCount === count) {
      throw new Error("You are not allowed to have circular dependencies in generators");
    }

    const nodesToRenderNext: any[] = [];
    const alreadyRenderedNodes = Object.keys(renderedContext);
    for (const nodeEntry of nodesToRender) {
      const dependencies = graph.inEdgeEntries(nodeEntry.node);
      //check if all dependencies have been rendered
      let allRendered = true;
      for (const dependency of dependencies) {
      if (!alreadyRenderedNodes.includes(dependency.source)) {
          allRendered = false;
          break;
        }
      }
  
      if (allRendered) {
        const result = await renderGenerator(nodeEntry.attributes.generator, context, renderedContext);
        renderedContext[nodeEntry.node] = result;
      } else {
        nodesToRenderNext.push(nodeEntry);
      }
    }
    if (nodesToRenderNext.length > 0) {
      await recursivelyRenderGenerators(nodesToRenderNext, count);
    }
  };
  await recursivelyRenderGenerators([...graph.nodeEntries()]);
}
