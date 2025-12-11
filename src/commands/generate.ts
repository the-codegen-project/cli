import {Args, Command, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {generateWithConfig} from '../codegen/generators';
import chokidar from 'chokidar';
import path from 'path';
import {realizeGeneratorContext} from '../codegen/configurations';
import {enhanceError} from '../codegen/errors';
import {trackEvent} from '../telemetry';
import {getInputSourceType, categorizeError} from '../telemetry/anonymize';
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
    const startTime = Date.now();
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

    // Determine input source type if file is provided
    let inputSource:
      | 'remote_url'
      | 'local_relative'
      | 'local_absolute'
      | undefined;
    if (file) {
      inputSource = getInputSourceType(file);
    }

    try {
      // Get the configuration context to access project-level telemetry settings
      const context = await realizeGeneratorContext(file);
      const projectTelemetryConfig = context.configuration.telemetry;

      if (watch) {
        // Track watch mode started (fire and forget, never throws)
        trackEvent(
          {
            event: 'watch_mode_started',
            command: 'generate',
            input_source: inputSource
          },
          projectTelemetryConfig
        );

        await this.runWithWatch({configFile: file, watchPath});
      } else {
        await generateWithConfig(file);
      }

      // Track each generator usage (fire and forget, never throws)
      for (const generator of context.configuration.generators) {
        const generatorStartTime = Date.now();
        const language =
          (generator as any).language ||
          context.configuration.language ||
          'typescript';

        // Sanitize options - remove sensitive data like paths
        const {id, preset, outputPath, dependencies, ...sanitizedOptions} =
          generator as any;

        trackEvent(
          {
            event: 'generator_used',
            generator_type: generator.preset,
            input_type: context.configuration.inputType,
            input_source: inputSource,
            language,
            options: sanitizedOptions,
            duration: Date.now() - generatorStartTime,
            success: true
          },
          projectTelemetryConfig
        );
      }

      // Track successful execution with generator combination (fire and forget, never throws)
      trackEvent(
        {
          event: 'command_executed',
          command: 'generate',
          flags: Object.keys(flags).filter(
            (f) => flags[f as keyof typeof flags]
          ),
          input_source: inputSource,
          input_type: context.configuration.inputType,
          generators: context.configuration.generators.map((g) => g.preset),
          generator_count: context.configuration.generators.length,
          duration: Date.now() - startTime,
          success: true
        },
        projectTelemetryConfig
      );
    } catch (error: unknown) {
      // Try to get project config for telemetry, but don't fail if we can't
      let projectTelemetryConfig;
      let generators;
      let generatorCount;
      let inputType;
      try {
        const context = await realizeGeneratorContext(file);
        projectTelemetryConfig = context.configuration.telemetry;
        generators = context.configuration.generators.map((g) => g.preset);
        generatorCount = context.configuration.generators.length;
        inputType = context.configuration.inputType;
      } catch {
        // If we can't get config (e.g., config error), continue without it
        projectTelemetryConfig = undefined;
        generators = undefined;
        generatorCount = undefined;
        inputType = undefined;
      }

      // Track failed execution (fire and forget, never throws)
      trackEvent(
        {
          event: 'command_executed',
          command: 'generate',
          flags: Object.keys(flags).filter(
            (f) => flags[f as keyof typeof flags]
          ),
          input_source: inputSource,
          input_type: inputType,
          generators,
          generator_count: generatorCount,
          duration: Date.now() - startTime,
          success: false,
          error_type: categorizeError(error)
        },
        projectTelemetryConfig
      );

      // Enhance error to provide user-friendly messages
      const codegenError = enhanceError(error);

      // Log the formatted error message
      this.error(codegenError.format(), {exit: 1});
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
        const codegenError = enhanceError(error);
        Logger.error(codegenError.format());
      } finally {
        isGenerating = false;
      }
    });

    watcher.on('error', (error: unknown) => {
      const codegenError = enhanceError(error);
      Logger.error(codegenError.format());
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
