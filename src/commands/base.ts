/**
 * Base command class with shared flags for verbosity and output control
 */
import {Command, Flags} from '@oclif/core';
import {Logger, LogLevel} from '../LoggingInterface';

export abstract class BaseCommand extends Command {
  static baseFlags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output'
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Only show errors and warnings',
      exclusive: ['verbose', 'silent']
    }),
    silent: Flags.boolean({
      description: 'Suppress all output except fatal errors',
      exclusive: ['verbose', 'quiet']
    }),
    json: Flags.boolean({
      description: 'Output results as JSON for scripting'
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output'
    }),
    debug: Flags.boolean({
      description: 'Show debug information',
      exclusive: ['quiet', 'silent']
    })
  };

  /**
   * Configure the logger based on parsed flags
   */
  protected setupLogger(flags: Record<string, unknown>): void {
    // Reset logger to default state first to ensure clean state between commands
    Logger.reset();

    let logLevel: LogLevel = 'info';
    if (flags.debug) {
      logLevel = 'debug';
    } else if (flags.verbose) {
      logLevel = 'verbose';
    } else if (flags.quiet) {
      logLevel = 'warn';
    } else if (flags.silent) {
      logLevel = 'silent';
    }

    Logger.setLevel(logLevel);
    Logger.setJsonMode(!!flags.json);
    Logger.setColors(!flags['no-color']);
  }
}
