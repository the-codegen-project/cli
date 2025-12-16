/* eslint-disable no-undef */
import {Args, Command, Flags} from '@oclif/core';
import {Logger} from '../LoggingInterface';
import {
  getTelemetryConfig,
  setTelemetryEnabled,
  isTelemetryEnabled
} from '../telemetry/config';
import {getConfigFilePath} from '../PersistedConfig';

export default class Telemetry extends Command {
  static description = 'Manage telemetry settings';

  static args = {
    action: Args.string({
      description: 'Action to perform: status, enable, or disable',
      required: true,
      options: ['status', 'enable', 'disable']
    })
  };

  static flags = {
    help: Flags.help()
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> status',
    '<%= config.bin %> <%= command.id %> enable',
    '<%= config.bin %> <%= command.id %> disable'
  ];

  async run() {
    const {args} = await this.parse(Telemetry);

    Logger.setLogger({
      info: (message: string, ...optionalParams: any[]) => {
        this.log(message, ...optionalParams);
      },
      debug: (message: string, ...optionalParams: any[]) => {
        this.debug(message, ...optionalParams);
      },
      warn: (message: string, ...optionalParams: any[]) => {
        this.warn(
          `${message}, additional info: ${optionalParams.map((param) => JSON.stringify(param)).join(' | ')}`
        );
      },
      error: (message: string, ...optionalParams: any[]) => {
        this.error(
          `${message}, additional info: ${optionalParams.map((param) => JSON.stringify(param)).join(' | ')}`
        );
      }
    });
    const {action} = args;

    try {
      switch (action) {
        case 'status':
          await this.showStatus();
          break;
        case 'enable':
          await this.enableTelemetry();
          break;
        case 'disable':
          await this.disableTelemetry();
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
  private async showStatus(): Promise<void> {
    const enabled = await isTelemetryEnabled();
    const config = await getTelemetryConfig();
    const configPath = getConfigFilePath();

    Logger.info('\n┌─────────────────────────────────────────────┐');
    Logger.info('│         Telemetry Status                    │');
    Logger.info('└─────────────────────────────────────────────┘\n');

    Logger.info(`Status: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    Logger.info(`\nConfig file: ${configPath}`);
    Logger.info(`Anonymous ID: ${config.anonymousId}`);
    Logger.info(`Endpoint: ${config.endpoint}`);

    Logger.info('\nWhat we collect:');
    Logger.info('  ✓ Command usage and flags');
    Logger.info('  ✓ Generator types used');
    Logger.info('  ✓ Input source types (remote/local)');
    Logger.info('  ✓ CLI version and Node.js version');
    Logger.info('  ✓ Error categories (not error messages)');
    Logger.info("\nWhat we DON'T collect:");
    Logger.info('  ✗ File paths or file names');
    Logger.info('  ✗ File contents');
    Logger.info('  ✗ Personal information');
    Logger.info('  ✗ Project names');

    Logger.info(
      '\nLearn more: https://the-codegen-project.org/docs/telemetry\n'
    );
  }

  /**
   * Enable telemetry
   */
  private async enableTelemetry(): Promise<void> {
    await setTelemetryEnabled(true);
    Logger.info('✅ Telemetry enabled');
    Logger.info('\nThank you for helping us improve The Codegen Project!');
    Logger.info('Learn more: https://the-codegen-project.org/docs/telemetry\n');
  }

  /**
   * Disable telemetry
   */
  private async disableTelemetry(): Promise<void> {
    await setTelemetryEnabled(false);
    Logger.info('✅ Telemetry disabled');
    Logger.info('\nYou can re-enable telemetry anytime with:');
    Logger.info('  codegen telemetry enable\n');
  }
}
