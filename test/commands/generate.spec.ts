import path from 'path';
import { runCommand } from '@oclif/test';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');

describe('generate', () => {
  it('should be able to generate hello world with custom presets', async () => {
    const {error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
  });

  describe('error handling', () => {
    it('should handle errors with invalid configuration content', async () => {
      const invalidConfig = path.resolve(__dirname, '../configs/invalid-test-config.js');
      const {error} = await runCommand(`generate ${invalidConfig}`);
      
      // Should produce an error about invalid preset
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Unable to determine default generator|invalid|preset/i);
    });

    it('should handle errors with malformed configuration file', async () => {
      const malformedConfig = path.resolve(__dirname, '../configs/malformed-test-config.js');
      const {error} = await runCommand(`generate ${malformedConfig}`);
      
      // Should produce an error about missing required fields
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Required at "inputPath"/i);
    });

    it('should handle errors with invalid input type', async () => {
      const testConfig = path.resolve(__dirname, '../configs/invalid-input-type-test.js');
      const {error} = await runCommand(`generate ${testConfig}`);
      
      // Should produce an error about invalid input type
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Invalid Discriminator value/i);
    });

    it('should validate error handling code path is exercised', async () => {
      // Test that the error handling code path is exercised
      // by using an invalid preset which will cause generateWithConfig to throw
      const invalidPresetConfig = path.resolve(__dirname, '../configs/invalid-preset-test.js');
      const {error} = await runCommand(`generate ${invalidPresetConfig}`);
      
      // The command should fail gracefully with an error
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Unable to determine default generator/i);
    });
  });

  describe('watch functionality', () => {
    it('should show watch flag in help output', async () => {
      const {stdout} = await runCommand('generate --help');
      expect(stdout).toContain('--watch');
      expect(stdout).toContain('-w');
      expect(stdout).toContain('--watchPath');
      expect(stdout).toContain('-p');
      expect(stdout).toContain('Watch for file changes');
    });
  });
});
