/* eslint-disable no-undef */
import {Args, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {
  getTelemetryConfig,
  setTelemetryEnabled,
  isTelemetryEnabled
} from '../telemetry/config';
import {getConfigFilePath} from '../PersistedConfig';
import {BaseCommand} from './base';
import pc from 'picocolors';

export default class Telemetry extends BaseCommand {
  static description = 'Manage telemetry settings';

  static args = {
    action: Args.string({
      description: 'Action to perform: status, enable, or disable',
      required: true,
      options: ['status', 'enable', 'disable']
    })
  };

  static flags = {
    help: Flags.help(),
    'no-color': Flags.boolean({
      description: 'Disable colored output'
    })
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> status',
    '<%= config.bin %> <%= command.id %> enable',
    '<%= config.bin %> <%= command.id %> disable'
  ];

  async run() {
    const {args, flags} = await this.parse(Telemetry);

    // Configure logger based on flags
    this.setupLogger(flags);

    const {action} = args;
    const useColors = !flags['no-color'];

    try {
      switch (action) {
        case 'status':
          await this.showStatus(useColors);
          break;
        case 'enable':
          await this.enableTelemetry(useColors);
          break;
        case 'disable':
          await this.disableTelemetry(useColors);
          break;
        default:
          this.error(
            `Unknown action: ${action}. Use status, enable, or disable.`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(`Failed to ${action} telemetry: ${message}`);
    }
  }

  /**
   * Show telemetry status
   */
  private async showStatus(useColors: boolean): Promise<void> {
    const enabled = await isTelemetryEnabled();
    const config = await getTelemetryConfig();
    const configPath = getConfigFilePath();

    const c = useColors ? pc : {cyan: (s: string) => s, green: (s: string) => s, red: (s: string) => s, dim: (s: string) => s};

    Logger.info(
      `\n${c.cyan('┌─────────────────────────────────────────────┐')}`
    );
    Logger.info(
      `${c.cyan('│')}         Telemetry Status                    ${c.cyan('│')}`
    );
    Logger.info(
      `${c.cyan('└─────────────────────────────────────────────┘')}\n`
    );

    Logger.info(
      `Status: ${enabled ? c.green('ENABLED') : c.red('DISABLED')}`
    );
    Logger.info(`\nConfig file: ${c.dim(configPath)}`);
    Logger.info(`Anonymous ID: ${c.dim(config.anonymousId)}`);
    Logger.info(`Endpoint: ${c.dim(config.endpoint)}`);

    Logger.info('\nWhat we collect:');
    Logger.info(`  ${c.green('✓')} Command usage and flags`);
    Logger.info(`  ${c.green('✓')} Generator types used`);
    Logger.info(`  ${c.green('✓')} Input source types (remote/local)`);
    Logger.info(`  ${c.green('✓')} CLI version and Node.js version`);
    Logger.info(`  ${c.green('✓')} Error categories (not error messages)`);
    Logger.info("\nWhat we DON'T collect:");
    Logger.info(`  ${c.red('✗')} File paths or file names`);
    Logger.info(`  ${c.red('✗')} File contents`);
    Logger.info(`  ${c.red('✗')} Personal information`);
    Logger.info(`  ${c.red('✗')} Project names`);

    Logger.info(
      `\nLearn more: ${c.cyan('https://the-codegen-project.org/docs/telemetry')}\n`
    );
  }

  /**
   * Enable telemetry
   */
  private async enableTelemetry(useColors: boolean): Promise<void> {
    await setTelemetryEnabled(true);
    const c = useColors ? pc : {cyan: (s: string) => s};

    Logger.info('✅ Telemetry enabled');
    Logger.info('\nThank you for helping us improve The Codegen Project!');
    Logger.info(
      `Learn more: ${c.cyan('https://the-codegen-project.org/docs/telemetry')}\n`
    );
  }

  /**
   * Disable telemetry
   */
  private async disableTelemetry(useColors: boolean): Promise<void> {
    await setTelemetryEnabled(false);
    const c = useColors ? pc : {dim: (s: string) => s};

    Logger.info('✅ Telemetry disabled');
    Logger.info('\nYou can re-enable telemetry anytime with:');
    Logger.info(`  ${c.dim('codegen telemetry enable')}\n`);
  }
}
