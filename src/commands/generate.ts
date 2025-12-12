import {Args, Command, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {generateWithConfig} from '../codegen/generators';
import chokidar from 'chokidar';
import path from 'path';
import {realizeGeneratorContext} from '../codegen/configurations';
import {enhanceError} from '../codegen/errors';
import {trackEvent} from '../telemetry';
import {getInputSourceType, categorizeError} from '../telemetry/anonymize';
import {RunGeneratorContext} from '../codegen';
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

    const context = await realizeGeneratorContext(file);
    
    try {
      if (watch) {
        await this.handleWatchModeStartedTelemetry({context, inputSource});
        await this.runWithWatch({configFile: file, watchPath});
      } else {
        await generateWithConfig(file);
      }

      await this.handleGeneratorUsageTelemetry({context, inputSource});
      await this.handleSuccessfulGenerateTelemetry({
        context,
        flags,
        inputSource,
        startTime
      });
    } catch (error: unknown) {
      await this.handleFailedGenerateTelemetry({
        error,
        context,
        flags,
        inputSource,
        startTime
      });
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
  async handleWatchModeStartedTelemetry({
    context,
    inputSource
  }: {
    context: RunGeneratorContext;
    inputSource: 'remote_url' | 'local_relative' | 'local_absolute' | undefined;
  }) {
    const projectTelemetryConfig = context.configuration.telemetry;

    // Track watch mode started (fire and forget, never throws)
    trackEvent(
      {
        event: 'watch_mode_started',
        command: 'generate',
        input_source: inputSource
      },
      projectTelemetryConfig
    );
  }

  async handleGeneratorUsageTelemetry({
    context,
    inputSource
  }: {
    context: RunGeneratorContext;
    inputSource: 'remote_url' | 'local_relative' | 'local_absolute' | undefined;
  }) {
    const projectTelemetryConfig = context.configuration.telemetry;

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
  }

  async handleSuccessfulGenerateTelemetry({
    context,
    flags,
    inputSource,
    startTime
  }: {
    context: RunGeneratorContext;
    flags: any;
    inputSource: 'remote_url' | 'local_relative' | 'local_absolute' | undefined;
    startTime: number;
  }) {
    const projectTelemetryConfig = context.configuration.telemetry;

    // Track successful execution with generator combination (fire and forget, never throws)
    trackEvent(
      {
        event: 'command_executed',
        command: 'generate',
        flags: Object.keys(flags).filter((f) => flags[f as keyof typeof flags]),
        input_source: inputSource,
        input_type: context.configuration.inputType,
        generators: context.configuration.generators.map((g) => g.preset),
        generator_count: context.configuration.generators.length,
        duration: Date.now() - startTime,
        success: true
      },
      projectTelemetryConfig
    );
  }

  async handleFailedGenerateTelemetry({
    error,
    context,
    flags,
    inputSource,
    startTime
  }: {
    error: unknown;
    context: RunGeneratorContext;
    flags: any;
    inputSource: 'remote_url' | 'local_relative' | 'local_absolute' | undefined;
    startTime: number;
  }) {
    // Try to get project config for telemetry, but don't fail if we can't
    const projectTelemetryConfig = context.configuration.telemetry;
    const generators = context.configuration.generators.map((g) => g.preset);
    const generatorCount = context.configuration.generators.length;
    const inputType = context.configuration.inputType;

    // Track failed execution (fire and forget, never throws)
    trackEvent(
      {
        event: 'command_executed',
        command: 'generate',
        flags: Object.keys(flags).filter((f) => flags[f as keyof typeof flags]),
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
  }
}
