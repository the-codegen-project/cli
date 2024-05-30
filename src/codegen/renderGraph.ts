import path from "node:path";
import { Generators, RunGeneratorContext } from "./types";
import { Logger } from "../LoggingInterface";
import { TypeScriptChannelsGenerator, generateTypeScriptChannels } from "./typescript/channels/index";
import { TypeScriptPayloadGenerator, generateTypescriptPayload } from "./typescript/payloads";
import { JavaPayloadGenerator, generateJavaPayload } from "./java/payloads";
import { TypescriptParametersGenerator, generateTypescriptParameters } from "./typescript/parameters";

export type Node = {
  generator: Generators
  leafs: Node[]
}

export function determineRenderGraph(context: RunGeneratorContext): Node[] {
  const { configuration } = context;
  const nodeMap: Record<string, Node> = {};
  const f = (generatorsToIterate: Generators[], previousCount?: number): Node[] => {
    const generatorsToIterateNext: Generators[] = [];
    const count = generatorsToIterate.length;
    if (previousCount === count) {
      throw new Error("Cant determine render graph, circular dependencies?");
    }

    const nodes: Node[] = [];
    generatorIterator:
    for (const generator of generatorsToIterate) {
      const dependencies = generator.dependencies ?? [];
      const id = generator.id!;
      if (dependencies.length === 0) {
        nodeMap[id] = { generator, leafs: [] };
      } else {
        const dependantNodes: Node[] = [];
        for (const dependency of dependencies) {
          const iteratedNode = nodeMap[dependency];
          if (iteratedNode === undefined) {
            generatorsToIterateNext.push(generator);
            continue generatorIterator;
          } else {
            dependantNodes.push(iteratedNode);
          }
        }

        nodeMap[id] = { generator, leafs: dependantNodes };
        nodes.push(nodeMap[id]);
      }
    }

    if (generatorsToIterateNext.length === 0) {
      return nodes;
    }
 
      return f(generatorsToIterateNext, count);
  };

  return f(configuration.generators);
}

let renderedContext: any = {};
export async function renderGraph(context: RunGeneratorContext, rootNodes: Node[]) {
  renderedContext = {};
  const renderBottomUp = async (nodes: Node[]) => {
    for (const node of nodes) {
      const id = node.generator.id ?? '';
      if (node.leafs) {
        let allRendered = true;
        for (const leaf of node.leafs) {
          const leafId = leaf.generator.id ?? '';
          if (!renderedContext[leafId]) {
            allRendered = false;
          }
        }

        if (allRendered) {
          const result = await renderGenerator(node.generator, context);
          renderedContext[id] = result;
        } else {
          await renderBottomUp(node.leafs);
        }
      } else {
        const result = await renderGenerator(node.generator, context);
        renderedContext[id] = result;
      }
    }
  };

  await renderBottomUp(rootNodes);
}

export async function renderGenerator(generator: Generators, context: RunGeneratorContext) {
	const {configuration, documentPath, asyncapiDocument, filePath} = context;
  const outputPath = path.resolve(path.dirname(filePath), (generator as any).outputPath);
  Logger.info(`Found output path for generator '${outputPath}'`);
  const language = (generator as any).language ? (generator as any).language : configuration.language;
  Logger.info(`Found language for generator '${language}'`);
  Logger.info(`Found preset for generator '${generator.preset}'`);
  switch (generator.preset) {
  case 'payloads': {
    switch (language) {
      case 'typescript': {
        return generateTypescriptPayload({
          asyncapiDocument,
          generator: {
            ...generator as TypeScriptPayloadGenerator,
            outputPath
          },
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        });
      }

      case 'java': {
        return generateJavaPayload({
          documentPath,
          generator: {
            ...generator,
            outputPath
          } as JavaPayloadGenerator,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        });
      }

      default: {
        throw 'Unable to determine language generator for payloads preset';
      }
    }
  
  break;
  }

  case "parameters": {
    switch (language) {
      case 'typescript': {
        return generateTypescriptParameters({
          generator: {
            ...generator,
            outputPath
          } as TypescriptParametersGenerator,
          inputType: configuration.inputType,
          asyncapiDocument,
          dependencyOutputs: renderedContext
        });
      }

      default: {
        throw 'Unable to determine language generator for parameters preset';
      }
    }
  
  break;
  }

  case "channels": {
    switch (language) {
      case 'typescript': {
        return generateTypeScriptChannels({
          asyncapiDocument,
          generator: {
            ...generator,
            outputPath
          } as TypeScriptChannelsGenerator,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        });
      }

      default: {
        throw 'Unable to determine language generator for channels preset';
      }
    }
  
  break;
  }

  case "custom": {
    return generator.renderFunction({
      asyncapiDocument,
      inputType: configuration.inputType,
      dependencyOutputs: renderedContext,
      generator
    });
  }
  // No default
  }
}
