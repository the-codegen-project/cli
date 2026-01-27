/* eslint-disable no-undef, sonarjs/cognitive-complexity */
import {Args, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {generateWithConfig} from '../codegen/generators';
import chokidar from 'chokidar';
import path from 'path';
import {realizeGeneratorContext} from '../codegen/configurations';
import {CodegenError, createGeneratorError} from '../codegen/errors';
import {trackEvent} from '../telemetry';
import {getInputSourceType, categorizeError} from '../telemetry/anonymize';
import {GenerationResult, RunGeneratorContext} from '../codegen';
import {BaseCommand} from './base';
import pc from 'picocolors';

/**
 * Converts any error to a CodegenError for consistent error handling.
 * If error is already a CodegenError, returns it directly.
 * Otherwise wraps it in a generic generator error.
 */
function toCodegenError(error: unknown): CodegenError {
  if (error instanceof CodegenError) {
    return error;
  }
  return createGeneratorError({
    generatorId: 'generate',
    originalError: error instanceof Error ? error : new Error(String(error))
  });
}

export default class Generate extends BaseCommand {
  static description =
    'Generate code based on your configuration, use `init` to get started, `generate` to generate code from the configuration.';
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
    }),
    ...BaseCommand.baseFlags
  };

  async run() {
    const startTime = Date.now();
    const {args, flags} = await this.parse(Generate);

    // Configure logger based on flags
    this.setupLogger(flags);

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

    let context: RunGeneratorContext;
    try {
      context = await realizeGeneratorContext(file);
    } catch (configError: unknown) {
      const codegenError = toCodegenError(configError);
      Logger.error(codegenError.format(!flags['no-color']));
      // Use error message that includes details for better test assertions
      const errorMessage = codegenError.details
        ? `${codegenError.message}: ${codegenError.details}`
        : codegenError.message;
      this.error(errorMessage, {exit: 1});
    }

    try {
      let result: GenerationResult | undefined;

      if (watch) {
        await this.handleWatchModeStartedTelemetry({context, inputSource});
        await this.runWithWatch({configFile: file, watchPath, flags});
      } else {
        Logger.startSpinner('Generating code...');
        result = await generateWithConfig(context);
        this.handleSuccessOutput(result, flags);
      }

      await this.handleGeneratorUsageTelemetry({context, inputSource});
      await this.handleSuccessfulGenerateTelemetry({
        context,
        flags,
        inputSource,
        startTime
      });
    } catch (error: unknown) {
      Logger.failSpinner('Generation failed');
      const codegenError = toCodegenError(error);
      Logger.error(codegenError.format(!flags['no-color']));
      await this.handleFailedGenerateTelemetry({
        error,
        context,
        flags,
        inputSource,
        startTime
      });
      // Use error message that includes details for better test assertions
      const errorMessage = codegenError.details
        ? `${codegenError.message}: ${codegenError.details}`
        : codegenError.message;
      this.error(errorMessage, {exit: 1});
    }
  }

  /**
   * Handle successful generation output based on flags
   */
  private handleSuccessOutput(
    result: GenerationResult,
    flags: {verbose?: boolean; json?: boolean; 'no-color'?: boolean}
  ): void {
    Logger.succeedSpinner(
      `Generated ${result.totalFiles} file${result.totalFiles !== 1 ? 's' : ''} in ${result.totalDuration}ms`
    );

    // Verbose: show file list
    if (flags.verbose && !flags.json) {
      for (const file of result.allFiles) {
        const relativePath = path.relative(process.cwd(), file);
        Logger.verbose(`  -> ${relativePath}`);
      }
    }

    // JSON output
    if (flags.json) {
      Logger.json({
        success: true,
        files: result.allFiles.map((file) =>
          path.relative(process.cwd(), file)
        ),
        generators: result.generators.map((gen) => ({
          id: gen.id,
          preset: gen.preset,
          files: gen.filesWritten.map((file) =>
            path.relative(process.cwd(), file)
          ),
          duration: gen.duration
        })),
        totalFiles: result.totalFiles,
        duration: result.totalDuration
      });
    }
  }

  private async runWithWatch({
    configFile,
    watchPath,
    flags
  }: {
    configFile?: string;
    watchPath?: string;
    flags: {verbose?: boolean; json?: boolean; 'no-color'?: boolean};
  }): Promise<void> {
    // Initial generation
    Logger.startSpinner('Generating initial code...');
    const initialResult = await generateWithConfig(configFile);
    Logger.succeedSpinner(
      `Initial generation complete (${initialResult.totalFiles} file${initialResult.totalFiles !== 1 ? 's' : ''})`
    );

    // Determine what to watch
    let pathToWatch: string;
    if (watchPath) {
      pathToWatch = path.resolve(watchPath);
    } else {
      // Get the input file path from configuration
      const context = await realizeGeneratorContext(configFile);
      pathToWatch = context.documentPath;
    }

    const useColors = !flags['no-color'];
    Logger.info(
      `\nWatching for changes in: ${useColors ? pc.cyan(pathToWatch) : pathToWatch}`
    );
    Logger.info(
      useColors
        ? pc.dim('Press Ctrl+C to stop watching...')
        : 'Press Ctrl+C to stop watching...'
    );

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
      Logger.startSpinner(
        `Regenerating (${path.basename(changedPath)} changed)...`
      );

      try {
        const result = await generateWithConfig(configFile);
        Logger.succeedSpinner(
          `Regenerated ${result.totalFiles} file${result.totalFiles !== 1 ? 's' : ''} in ${result.totalDuration}ms`
        );

        // Verbose: show file list
        if (flags.verbose && !flags.json) {
          for (const file of result.allFiles) {
            const relativePath = path.relative(process.cwd(), file);
            Logger.verbose(`  -> ${relativePath}`);
          }
        }
      } catch (error: unknown) {
        const codegenError = toCodegenError(error);
        Logger.failSpinner('Regeneration failed');
        Logger.error(codegenError.format(!flags['no-color']));
      } finally {
        isGenerating = false;
      }
    });

    watcher.on('error', (error: unknown) => {
      const codegenError = toCodegenError(error);
      Logger.error(codegenError.format(!flags['no-color']));
    });

    // Set up graceful shutdown handlers
    const cleanup = () => {
      Logger.info('\nStopping file watcher...');
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
          options: JSON.stringify(sanitizedOptions),
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
    const activeFlags = Object.keys(flags).filter(
      (f) => flags[f as keyof typeof flags]
    );
    const generatorPresets = context.configuration.generators.map(
      (g) => g.preset
    );

    trackEvent(
      {
        event: 'command_executed',
        command: 'generate',
        flags: activeFlags.length > 0 ? activeFlags.join(',') : 'none',
        input_source: inputSource || 'unknown',
        input_type: context.configuration.inputType,
        generators: generatorPresets.join(','),
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
    const activeFlags = Object.keys(flags).filter(
      (f) => flags[f as keyof typeof flags]
    );

    trackEvent(
      {
        event: 'command_executed',
        command: 'generate',
        flags: activeFlags.length > 0 ? activeFlags.join(',') : 'none',
        input_source: inputSource || 'unknown',
        input_type: inputType,
        generators: Array.isArray(generators)
          ? generators.join(',')
          : String(generators),
        generator_count: generatorCount,
        duration: Date.now() - startTime,
        success: false,
        error_type: categorizeError(error)
      },
      projectTelemetryConfig
    );
  }
}
