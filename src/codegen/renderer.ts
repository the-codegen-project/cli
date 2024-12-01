import {Logger} from '../LoggingInterface';
import {Generators, GeneratorsInternal, RunGeneratorContext} from './types';
import {
  TypeScriptPayloadGeneratorInternal,
  TypescriptParametersGeneratorInternal,
  TypeScriptClientGeneratorInternal,
  TypeScriptChannelsGeneratorInternal,
  generateTypeScriptChannels,
  generateTypeScriptClient,
  generateTypescriptParameters,
  generateTypescriptPayload
} from './generators';
import path from 'path';
import Graph from 'graphology';
import {findDuplicatesInArray} from './utils';

export type Node = {
  generator: Generators;
};
type GraphType = Graph<Node>;

export async function renderGenerator(
  generator: GeneratorsInternal,
  context: RunGeneratorContext,
  renderedContext: Record<any, any>
) {
  const {configuration, asyncapiDocument, configFilePath} = context;
  const outputPath = path.resolve(
    path.dirname(configFilePath),
    (generator as any).outputPath ?? ''
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
              ...(generator as TypeScriptPayloadGeneratorInternal),
              outputPath
            },
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
            } as TypescriptParametersGeneratorInternal,
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
            } as TypeScriptChannelsGeneratorInternal,
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

    case 'client': {
      switch (language) {
        case 'typescript': {
          return generateTypeScriptClient({
            asyncapiDocument,
            generator: {
              ...generator,
              outputPath
            } as TypeScriptClientGeneratorInternal,
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

export function determineRenderGraph(context: RunGeneratorContext): GraphType {
  const {configuration} = context;
  const duplicateGenerators = findDuplicatesInArray(
    context.configuration.generators,
    'id'
  );
  if (duplicateGenerators.length > 0) {
    throw new Error(
      `There are two or more generators that use the same id, please use unique id's for each generator, id('s) are ${duplicateGenerators.join(', ')}`
    );
  }

  const graph = new Graph<Node>({allowSelfLoops: true, type: 'directed'});
  for (const generator of configuration.generators as Generators[]) {
    graph.addNode(generator.id, {generator});
  }
  for (const generator of configuration.generators as Generators[]) {
    for (const dependency of generator.dependencies ?? []) {
      graph.addDirectedEdge(dependency, generator.id);
    }
  }

  if (graph.selfLoopCount !== 0) {
    throw new Error('You are not allowed to have self dependant generators');
  }

  return graph;
}

/**
 * Recursively go over all nodes and render those that are ready to be rendered (no dependencies that have not been rendered) and recursively do it until no nodes are left
 */
export async function renderGraph(
  context: RunGeneratorContext,
  graph: GraphType
) {
  const renderedContext: any = {};
  const recursivelyRenderGenerators = async (
    nodesToRender: any[],
    previousCount?: number
  ) => {
    const count = nodesToRender.length;
    if (previousCount === count) {
      throw new Error(
        'You are not allowed to have circular dependencies in generators'
      );
    }

    const nodesToRenderNext: any[] = [];
    const alreadyRenderedNodes = Object.keys(renderedContext);
    for (const nodeEntry of nodesToRender) {
      const dependencies = graph.inEdgeEntries(nodeEntry.node);
      //check if all dependencies have been rendered, if not, wait until later
      let allRendered = true;
      for (const dependency of dependencies) {
        if (!alreadyRenderedNodes.includes(dependency.source)) {
          allRendered = false;
          break;
        }
      }

      if (allRendered) {
        const result = await renderGenerator(
          nodeEntry.attributes.generator,
          context,
          renderedContext
        );
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
