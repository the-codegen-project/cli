import {Args, Command, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {generateWithConfig} from '../codegen/generators';
import chokidar from 'chokidar';
import path from 'path';
import {realizeGeneratorContext} from '../codegen/configurations';
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
    help: Flags.help(),
    watch: Flags.boolean({
      char: 'w',
      description: 'Watch for file changes and regenerate code automatically'
    }),
    watchPath: Flags.string({
      char: 'p',
      description:
        'Optional path to watch for changes when --watch flag is used. If not provided, watches the input file from configuration'
    })
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
    const {watch, watchPath} = flags;
    try {
      if (watch) {
        await this.runWithWatch({configFile: file, watchPath});
      } else {
        await generateWithConfig(file);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(errorMessage);
      this.exit(1);
    }
  }

  private async runWithWatch({
    configFile,
    watchPath
  }: {
    configFile?: string;
    watchPath?: string;
  }): Promise<void> {
    // Initial generation
    Logger.info('Generating initial code...');
    await generateWithConfig(configFile);
    Logger.info('Initial generation complete. Starting watch mode...');

    // Determine what to watch
    let pathToWatch: string;
    if (watchPath) {
      pathToWatch = path.resolve(watchPath);
    } else {
      // Get the input file path from configuration
      const context = await realizeGeneratorContext(configFile);
      pathToWatch = context.documentPath;
    }

    Logger.info(`Watching for changes in: ${pathToWatch}`);

    // Set up file watcher
    const watcher = chokidar.watch(pathToWatch, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    let isGenerating = false;

    watcher.on('change', async (changedPath: string) => {
      if (isGenerating) {
        Logger.debug('Generation already in progress, skipping...');
        return;
      }

      isGenerating = true;
      Logger.info(`File changed: ${changedPath}`);
      Logger.info('Regenerating code...');

      try {
        await generateWithConfig(configFile);
        Logger.info('Code regenerated successfully');
      } catch (error: unknown) {
        Logger.error(`Error during regeneration: ${error}`);
      } finally {
        isGenerating = false;
      }
    });

    watcher.on('error', (error: unknown) => {
      Logger.error(`Watcher error: ${error}`);
    });

    // Keep the process running
    Logger.info('Press Ctrl+C to stop watching...');

    // Set up graceful shutdown handlers
    const cleanup = () => {
      Logger.info('Stopping file watcher...');
      watcher.close();
    };

    // Handle process signals for graceful shutdown
    // eslint-disable-next-line no-undef
    process.on('SIGINT', cleanup);
    // eslint-disable-next-line no-undef
    process.on('SIGTERM', cleanup);

    // Keep the process alive by waiting indefinitely
    return new Promise<void>(() => {
      // This promise never resolves, keeping the process alive
      // The process will exit when SIGINT/SIGTERM is received
    });
  }
}
