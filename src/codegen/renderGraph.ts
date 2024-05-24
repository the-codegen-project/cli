import path from "path";
import { Generators, RunGeneratorContext } from "./types.js";
import { Logger } from "../LoggingInterface.js";
import { TypeScriptChannelsGenerator, generateTypeScriptChannels } from "./typescript/channels/index.js";
import { TypeScriptPayloadGenerator, generateTypescriptPayload } from "./typescript/payloads.js";
import { JavaPayloadGenerator, generateJavaPayload } from "./java/payloads.js";
import { TypescriptParametersGenerator, generateTypescriptParameters } from "./typescript/parameters.js";

export type Node = {
  generator: Generators
  leafs: Node[]
}

export function determineRenderGraph(context: RunGeneratorContext): Node[] {
  const { configuration } = context;
  const nodeMap: Record<string, Node> = {};
  const f = (generatorsToIterate: Generators[], previousCount?: number ): Node[] => {
    const generatorsToIterateNext: Generators[] = [];
    let count = generatorsToIterate.length;
    if (previousCount === count) {
      throw new Error("Cant determine render graph, circular dependencies?");
    }
    const nodes: Node[] = []
    generatorIterator:
    for (const generator of generatorsToIterate) {
      const dependencies = generator.dependencies ?? [];
      const id = generator.id!;
      if (dependencies.length === 0) {
        nodeMap[id] = { generator, leafs: [] };
      } else {
        const dependantNodes: Node[] = []
        for (const dependency of dependencies) {
          const iteratedNode = nodeMap[dependency]
          if (iteratedNode === undefined) {
            generatorsToIterateNext.push(generator);
            continue generatorIterator;
          } else {
            dependantNodes.push(iteratedNode)
          }
        }
        nodeMap[id] = { generator, leafs: dependantNodes };
        nodes.push(nodeMap[id])
      }
    }
    if(generatorsToIterateNext.length === 0) {
      return nodes;
    } else {
      return f(generatorsToIterateNext, count);
    }
  };
  return f(configuration.generators);
}

let renderedContext: any = {}
export async function renderGraph(context: RunGeneratorContext, rootNodes: Node[]){
  renderedContext = {}
  const renderBottomUp = async (nodes: Node[]) => {
    for (const node of nodes) {
      const id = node.generator.id ?? '';
      if(node.leafs) {
        let allRendered = true
        for (const leafs of node.leafs) {
          if(!renderedContext[id]){
            allRendered = false
          }
        }
        if(allRendered) {
          const result = await renderGenerator(node.generator, context)
          renderedContext[id] = result
        } else {
          await renderBottomUp(node.leafs)
        }
      } else {
        const result = await renderGenerator(node.generator, context)
        renderedContext[id] = result
      }
    }
  }
  await renderBottomUp(rootNodes)
}

export async function renderGenerator(generator: Generators, context: RunGeneratorContext) {
	const {configuration, documentPath, asyncapiDocument, filePath} = context;
  const outputPath = path.resolve(path.dirname(filePath), (generator as any).outputPath);
  Logger.info(`Found output path for generator '${outputPath}'`);
  const language = (generator as any).language ? (generator as any).language : configuration.language;
  Logger.info(`Found language for generator '${language}'`);
  Logger.info(`Found preset for generator '${generator.preset}'`);
  if(generator.preset === 'payloads') {
    switch (language) {
      case 'typescript':
        return await generateTypescriptPayload({
          asyncapiDocument,
          generator: {
            ...generator as TypeScriptPayloadGenerator,
            outputPath: outputPath
          },
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        })
      case 'java':
        return await generateJavaPayload({
          documentPath,
          generator: {
            ...generator,
            outputPath: outputPath
          } as JavaPayloadGenerator,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        })
      default:
        return Promise.reject('Unable to determine language generator for payloads preset');
    }
  } else if(generator.preset === "parameters") {
    switch (language) {
      case 'typescript':
        return await generateTypescriptParameters({
          generator: {
            ...generator,
            outputPath: outputPath
          } as TypescriptParametersGenerator,
          inputType: configuration.inputType,
          asyncapiDocument,
          dependencyOutputs: renderedContext
        })
      default:
        return Promise.reject('Unable to determine language generator for parameters preset');
    }
  } else if(generator.preset === "channels") {
    switch (language) {
      case 'typescript':
        return await generateTypeScriptChannels({
          asyncapiDocument,
          generator: {
            ...generator,
            outputPath: outputPath
          } as TypeScriptChannelsGenerator,
          inputType: configuration.inputType,
          dependencyOutputs: renderedContext
        })
      default:
        return Promise.reject('Unable to determine language generator for channels preset');
    }
  } else if(generator.preset === "custom") {
    return await generator.renderFunction({
      asyncapiDocument,
      inputType: configuration.inputType,
      dependencyOutputs: renderedContext,
      generator
    })
  }
}