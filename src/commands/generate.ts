import {Args, Command, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import { generateWithConfig } from '../codegen/generators';
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
    await generateWithConfig(file);
  }
}
