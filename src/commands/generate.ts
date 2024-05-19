import { Args, Command, Flags } from '@oclif/core';
import path from 'path';
import {loadConfigFile} from '../codegen/configuration-manager.js'
import { Logger } from '../LoggingInterface.js';
import { loadAsyncapi } from '../codegen/inputs/asyncapi.js';
import { RunGeneratorContext } from '../codegen/types.js';
import { runGenerators } from '../codegen/index.js';
export default class Generate extends Command {
  static description = 'Generate';
  static args = {
    file: Args.string({description: 'Path or URL to the configuration file, defaults to root of where the command is run'}),
  };

  static flags = {
    help: Flags.help({ char: 'h' })
  };

  async run() {
    const { args, flags } = await this.parse(Generate);
    Logger.setLogger({
      info: (message: string) => {
        this.log(message);
      },
      debug: (message: string) => {
        this.debug(message);
      },
      warn: (message: string) => {
        this.warn(message);
      },
      error: (message: string) => {
        this.error(message);
      },
    });
    const { file } = args;
    let filePath: string;
    if(!file) {
      filePath = path.resolve(process.cwd(), 'codegen.mjs');
    } else {
      filePath = file;
    }
    Logger.info(`Found config file at ${filePath}`);
    const configuration = await loadConfigFile({
      configPath: filePath,
      configType: 'esm'
    })
    Logger.info(`Found configuration was ${JSON.stringify(configuration)}`);
    
    const documentPath = path.resolve(path.dirname(filePath), configuration.inputPath);
    Logger.info(`Found document at '${documentPath}'`);
    Logger.info(`Found input '${configuration.inputType}'`);
    const context: RunGeneratorContext = {configuration, documentPath, filePath};
    if(configuration.inputType === 'asyncapi') {
      const document = await loadAsyncapi(context)
      context.asyncapiDocument = document;
    }
    
    await runGenerators(context)
  }
}