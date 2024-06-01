import path from "path";
import { Generators, RunGeneratorContext } from "../types";
import { Logger } from "../../LoggingInterface";
import { TypeScriptChannelsGenerator, generateTypeScriptChannels } from "./typescript/channels/index";
import { TypeScriptPayloadGenerator, generateTypescriptPayload } from "./typescript/payloads";
import { JavaPayloadGenerator, generateJavaPayload } from "./java/payloads";
import { TypescriptParametersGenerator, generateTypescriptParameters } from "./typescript/parameters";

export async function renderGenerator(generator: Generators, context: RunGeneratorContext, renderedContext: Record<any, any>) {
	const {configuration, documentPath, asyncapiDocument, configFilePath} = context;
  const outputPath = path.resolve(path.dirname(configFilePath), (generator as any).outputPath);
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
        throw new Error('Unable to determine language generator for payloads preset');
      }
    }
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
        throw new Error('Unable to determine language generator for parameters preset');
      }
    }
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
        throw new Error('Unable to determine language generator for channels preset');
      }
    }
  }

  case "custom": {
    return generator.renderFunction({
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
