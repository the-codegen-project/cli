import {Logger} from '../LoggingInterface';
import {
  GenerationResult,
  GeneratorResult,
  Generators,
  GeneratorsInternal,
  RenderTypes,
  RunGeneratorContext
} from './types';
import {
  generateTypeScriptChannels,
  generateTypeScriptClient,
  generateTypescriptParameters,
  generateTypescriptPayload,
  generateTypescriptHeaders,
  generateTypescriptTypes,
  CustomGeneratorInternal
} from './generators';
import path from 'path';
import Graph from 'graphology';
import {findDuplicatesInArray} from './utils';
import {generateTypescriptModels} from './generators/typescript/models';
import {
  createUnsupportedLanguageError,
  createUnsupportedPresetForInputError,
  createDuplicateGeneratorIdError,
  createCircularDependencyError
} from './errors';

export type Node = {
  generator: Generators;
};
type GraphType = Graph<Node>;

//eslint-disable-next-line sonarjs/cognitive-complexity
export async function renderGenerator(
  generator: GeneratorsInternal,
  context: RunGeneratorContext,
  renderedContext: Record<any, any>
): Promise<RenderTypes> {
  const {
    configuration,
    asyncapiDocument,
    openapiDocument,
    jsonSchemaDocument,
    configFilePath
  } = context;
  const outputPath = path.resolve(
    path.dirname(configFilePath),
    generator.outputPath ?? ''
  );
  const language = generator.language
    ? generator.language
    : configuration.language;
  Logger.debug(
    `Generator ${generator.id}: outputPath=${outputPath}, language=${language}, preset=${generator.preset}`
  );
  // Check if this generator is compatible with the input type
  if (
    configuration.inputType === 'jsonschema' &&
    generator.preset !== 'models' &&
    generator.preset !== 'custom'
  ) {
    throw createUnsupportedPresetForInputError({
      preset: generator.preset,
      inputType: 'jsonschema',
      supportedPresets: ['models', 'custom']
    });
  }

  switch (generator.preset) {
    case 'payloads': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptPayload({
            asyncapiDocument,
            openapiDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'payloads',
            language: language ?? 'unknown'
          });
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
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            asyncapiDocument,
            openapiDocument,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'parameters',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'headers': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptHeaders({
            asyncapiDocument,
            openapiDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'headers',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'types': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptTypes({
            asyncapiDocument,
            openapiDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'types',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'channels': {
      switch (language) {
        case 'typescript': {
          return generateTypeScriptChannels({
            asyncapiDocument,
            openapiDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'channels',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'client': {
      switch (language) {
        case 'typescript': {
          return generateTypeScriptClient({
            asyncapiDocument,
            openapiDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType as 'asyncapi' | 'openapi',
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'client',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'models': {
      switch (language) {
        case 'typescript': {
          return generateTypescriptModels({
            asyncapiDocument,
            openapiDocument,
            jsonSchemaDocument,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            inputType: configuration.inputType,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'models',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'custom': {
      return (generator as CustomGeneratorInternal).renderFunction(
        {
          asyncapiDocument,
          openapiDocument,
          jsonSchemaDocument,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext,
          generator
        },
        (generator as CustomGeneratorInternal).options
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
    throw createDuplicateGeneratorIdError({duplicateIds: duplicateGenerators});
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
    throw createCircularDependencyError();
  }

  return graph;
}

/**
 * Recursively go over all nodes and render those that are ready to be rendered (no dependencies that have not been rendered) and recursively do it until no nodes are left
 */
export async function renderGraph(
  context: RunGeneratorContext,
  graph: GraphType
): Promise<GenerationResult> {
  const startTime = Date.now();
  const renderedContext: any = {};
  const generatorResults: GeneratorResult[] = [];

  const recursivelyRenderGenerators = async (
    nodesToRender: any[],
    previousCount?: number
  ) => {
    const count = nodesToRender.length;
    if (previousCount === count) {
      throw createCircularDependencyError();
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
        const generatorStartTime = Date.now();
        Logger.updateSpinner(
          `Generating ${nodeEntry.attributes.generator.preset}...`
        );
        const result = await renderGenerator(
          nodeEntry.attributes.generator,
          context,
          renderedContext
        );
        renderedContext[nodeEntry.node] = result;

        // Record generator result - extract filesWritten from result
        generatorResults.push({
          id: nodeEntry.attributes.generator.id,
          preset: nodeEntry.attributes.generator.preset,
          filesWritten: (result as any)?.filesWritten ?? [],
          duration: Date.now() - generatorStartTime
        });
      } else {
        nodesToRenderNext.push(nodeEntry);
      }
    }
    if (nodesToRenderNext.length > 0) {
      await recursivelyRenderGenerators(nodesToRenderNext, count);
    }
  };
  await recursivelyRenderGenerators([...graph.nodeEntries()]);

  // Collect all files (deduplicated)
  const allFiles = [
    ...new Set(generatorResults.flatMap((g) => g.filesWritten))
  ];

  return {
    generators: generatorResults,
    totalFiles: allFiles.length,
    totalDuration: Date.now() - startTime,
    allFiles
  };
}
