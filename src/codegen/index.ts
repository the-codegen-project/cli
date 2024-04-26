import path from "path";
import { CodegenConfiguration } from "./configuration-manager.js";
import { JavaPayloadGenerator, generateJavaPayload } from "./java/payloads.js";
import { TypeScriptPayloadGenerator, generateTypescriptPayload } from "./typescript/payloads.js";
import { Logger } from "../LoggingInterface.js";

export type Generators = JavaPayloadGenerator & TypeScriptPayloadGenerator;
export interface RunGeneratorContext {
  configuration: CodegenConfiguration
  filePath: string,
  documentPath: string
}
export async function runGenerators(context: RunGeneratorContext){
	const {configuration, documentPath, filePath} = context;
  Logger.info(`Found ${configuration.generators.length} generator(s) with context documentPath ${documentPath}, filePath ${filePath}`);
  for (const generator of configuration.generators) {
    const outputPath = path.resolve(path.dirname(filePath), generator.outputPath);
    Logger.info(`Found output path for generator '${outputPath}'`);
    const language = generator.language ? generator.language : configuration.language;
    Logger.info(`Found language for generator '${language}'`);
    if(!language){
      return Promise.reject('Could not determine the language, please set either the language globally or locally in each configuration');
    }
    Logger.info(`Found preset for generator '${generator.preset}'`);
    if(generator.preset === 'payloads') {
      switch (language) {
        case 'typescript':
          await generateTypescriptPayload({
            documentPath,
            generator: {
              ...generator,
              outputPath: outputPath
            },
            inputType: configuration.inputType
          })
          break;
        case 'java':
          await generateJavaPayload({
            documentPath,
            generator: {
              ...generator,
              outputPath: outputPath
            },
            inputType: configuration.inputType
          })
          break;
        default:
          return Promise.reject('Unable to determine language generator for payloads preset');
      }
    }
  }
}