import path from "path";
import { JavaPayloadGenerator, generateJavaPayload } from "./java/payloads.js";
import { TypeScriptPayloadGenerator, generateTypescriptPayload } from "./typescript/payloads.js";
import { Logger } from "../LoggingInterface.js";
import { TypescriptParametersGenerator, generateTypescriptParameters } from "./typescript/parameters.js";
import { TypeScriptChannelsGenerator, generateTypeScriptChannels } from "./typescript/channels/index.js";
import { CodegenConfiguration, Generators, SupportedLanguages } from "./types.js";

export interface RunGeneratorContext {
  configuration: CodegenConfiguration
  filePath: string,
  documentPath: string
}

/**
 * Generators that can be run directly without any dependencies
 */
const level1Generators = ['payloads', 'parameters']
/**
 * Generators that can be run after level 1 generators 
 */
const level2Generators = ['channels']

function findGenerators(generatorsToFind: string[], generators: Generators[]){
  return generators.filter((generator) => generatorsToFind.includes(generator.preset))
}

export async function runGenerators(context: RunGeneratorContext){
	const {configuration, documentPath, filePath} = context;
  Logger.info(`Found ${configuration.generators.length} generator(s) with context documentPath ${documentPath}, filePath ${filePath}`);
  const outputs: Record<string, Record<SupportedLanguages, any>> = {}
  for (const generators of [level1Generators, level2Generators]) {
    const generatorsToRun = findGenerators(generators, configuration.generators)
    for (const generator of generatorsToRun) {
      const outputPath = path.resolve(path.dirname(filePath), generator.outputPath);
      Logger.info(`Found output path for generator '${outputPath}'`);
      const language = generator.language ? generator.language : configuration.language;
      Logger.info(`Found language for generator '${language}'`);
      if(!language){
        return Promise.reject('Could not determine the language, please set either the language globally or locally in each configuration');
      }
      const previousRuns = outputs[generator.preset][language] ?? []
      Logger.info(`Found preset for generator '${generator.preset}'`);
      if(generator.preset === 'payloads') {
        switch (language) {
          case 'typescript':
            const generatorType = await generateTypescriptPayload({
              documentPath,
              generator: {
                ...generator as TypeScriptPayloadGenerator,
                outputPath: outputPath
              },
              inputType: configuration.inputType
            })
            previousRuns.push(generatorType);
            break;
          case 'java':
            await generateJavaPayload({
              documentPath,
              generator: {
                ...generator,
                outputPath: outputPath
              } as JavaPayloadGenerator,
              inputType: configuration.inputType
            })
            break;
          default:
            return Promise.reject('Unable to determine language generator for payloads preset');
        }
      }

      if(generator.preset === "parameters") {
        switch (language) {
          case 'typescript':
            await generateTypescriptParameters({
              documentPath,
              generator: {
                ...generator,
                outputPath: outputPath
              } as TypescriptParametersGenerator,
              inputType: configuration.inputType
            })
            break;
          default:
            return Promise.reject('Unable to determine language generator for parameters preset');
        }
      }

      if(generator.preset === "channels") {
        switch (language) {
          case 'typescript':
            await generateTypeScriptChannels({
              documentPath,
              generator: {
                ...generator,
                outputPath: outputPath
              } as TypeScriptChannelsGenerator,
              inputType: configuration.inputType
            })
            break;
          default:
            return Promise.reject('Unable to determine language generator for channels preset');
        }
      }
      outputs[generator.preset][language] = previousRuns;
    }
  }
}

function determineRenderGraph(context: RunGeneratorContext){
  const {configuration} = context;
}