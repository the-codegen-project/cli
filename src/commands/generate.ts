import {Args, Command, Flags} from '@oclif/core';
import path from 'node:path';
import {loadConfigFile} from '../codegen/configuration-manager';
import {Logger} from '../LoggingInterface';
import {loadAsyncapi} from '../codegen/inputs/asyncapi';
import {RunGeneratorContext} from '../codegen/types';
import {runGenerators} from '../codegen/index';
export default class Generate extends Command {
  static description =
    'Generate code based on your configuration, use `init` to get started.';
  static args = {
    file: Args.string({
      description:
        'Path or URL to the configuration file, defaults to root of where the command is run'
    })
  };

  static flags = {
    help: Flags.help()
  };

  async run() {
    const {args, flags} = await this.parse(Generate);
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
      }
    });
    const {file} = args;
    // eslint-disable-next-line no-undef
    const {config, filePath} = await loadConfigFile(file);
    Logger.info(`Found configuration was ${JSON.stringify(config)}`);
    const documentPath = path.resolve(path.dirname(filePath), config.inputPath);
    Logger.info(`Found document at '${documentPath}'`);
    Logger.info(`Found input '${config.inputType}'`);
    const context: RunGeneratorContext = {
      configuration: config,
      documentPath,
      configFilePath: filePath
    };
    if (config.inputType === 'asyncapi') {
      const document = await loadAsyncapi(context);
      context.asyncapiDocument = document;
    }

    await runGenerators(context);
  }
}
