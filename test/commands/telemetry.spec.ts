import {runCommand} from '@oclif/test';

describe('telemetry command', () => {
  describe('help', () => {
    it('should show help with available actions', async () => {
      const {stdout} = await runCommand('telemetry --help');

      expect(stdout).toContain('status');
      expect(stdout).toContain('enable');
      expect(stdout).toContain('disable');
      expect(stdout).toContain('Manage telemetry settings');
    });
  });

  describe('status action', () => {
    it('should display telemetry status information', async () => {
      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain('Telemetry Status');
      expect(stdout).toContain('Config file:');
      expect(stdout).toContain('config.json');
      expect(stdout).toContain('What we collect:');
      expect(stdout).toContain("What we DON'T collect:");
      expect(stdout).toContain('Learn more:');
    });

    it('should show ENABLED or DISABLED status', async () => {
      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      // Should contain either ENABLED or DISABLED
      expect(stdout).toMatch(/ENABLED|DISABLED/);
    });
  });

  describe('enable action', () => {
    it('should show success message when enabling', async () => {
      const {stdout, error} = await runCommand('telemetry enable');

      expect(error).toBeUndefined();
      expect(stdout).toContain('✅ Telemetry enabled');
      expect(stdout).toContain('Thank you for helping us improve');
    });
  });

  describe('disable action', () => {
    it('should show success message when disabling', async () => {
      const {stdout, error} = await runCommand('telemetry disable');

      expect(error).toBeUndefined();
      expect(stdout).toContain('✅ Telemetry disabled');
      expect(stdout).toContain('You can re-enable telemetry anytime');
    });
  });

  describe('environment variable handling', () => {
    it('should show DO_NOT_TRACK in status when set', async () => {
      process.env.DO_NOT_TRACK = '1';

      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain('DISABLED');
      expect(stdout).toContain('DO_NOT_TRACK=1');

      delete process.env.DO_NOT_TRACK;
    });

    it('should show CODEGEN_TELEMETRY_DISABLED in status when set', async () => {
      process.env.CODEGEN_TELEMETRY_DISABLED = '1';

      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain('DISABLED');
      expect(stdout).toContain('CODEGEN_TELEMETRY_DISABLED=1');

      delete process.env.CODEGEN_TELEMETRY_DISABLED;
    });
  });

  describe('privacy information', () => {
    it('should show what data is collected', async () => {
      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain('What we collect:');
      expect(stdout).toContain('Command usage and flags');
      expect(stdout).toContain('Generator types used');
      expect(stdout).toContain('Input source types');
    });

    it('should show what data is NOT collected', async () => {
      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain("What we DON'T collect:");
      expect(stdout).toContain('File paths or file names');
      expect(stdout).toContain('File contents');
      expect(stdout).toContain('Personal information');
    });

    it('should provide documentation link', async () => {
      const {stdout, error} = await runCommand('telemetry status');

      expect(error).toBeUndefined();
      expect(stdout).toContain('https://the-codegen-project.org/docs/telemetry');
    });
  });
});

