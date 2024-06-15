import { Args, Command, Flags } from '@oclif/core';
import path from 'node:path';
import {discoverConfiguration, loadConfigFile} from '../codegen/configuration-manager';
import { Logger } from '../LoggingInterface';
import { loadAsyncapi } from '../codegen/inputs/asyncapi';
import { RunGeneratorContext } from '../codegen/types';
import { runGenerators } from '../codegen/index';
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
    // eslint-disable-next-line no-undef
    const configurationArgument = await discoverConfiguration(file);
    Logger.info(`Found config file at ${configurationArgument.configPath}`);
    const configuration = await loadConfigFile(configurationArgument);
    Logger.info(`Found configuration was ${JSON.stringify(configuration)}`);
    
    const documentPath = path.resolve(path.dirname(configurationArgument.configPath), configuration.inputPath);
    Logger.info(`Found document at '${documentPath}'`);
    Logger.info(`Found input '${configuration.inputType}'`);
    const context: RunGeneratorContext = {configuration, documentPath, configFilePath: configurationArgument.configPath};
    if (configuration.inputType === 'asyncapi') {
      const document = await loadAsyncapi(context);
      context.asyncapiDocument = document;
    }
    
    await runGenerators(context);
  }
}
