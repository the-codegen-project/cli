import path from 'path';
import { runCommand } from '@oclif/test';
import fs from 'fs';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');

describe('generate', () => {
  it('should be able generate simple configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  
  it('should be able to generate hello world with custom presets', async () => {
    const {stdout, stderr, error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('Hello World!');
  });

  describe('error handling', () => {
    it('should handle errors with invalid configuration content', async () => {
      // Create a temporary invalid config file with invalid preset
      const invalidConfig = path.resolve(__dirname, '../configs/invalid-test-config.js');
      const {error} = await runCommand(`generate ${invalidConfig}`);
      
      // Should produce an error about invalid preset
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Unable to determine default generator|invalid|preset/i);
    });

    it('should handle errors with malformed configuration file', async () => {
      // Create a temporary malformed config file missing required fields
      const malformedConfig = path.resolve(__dirname, '../configs/malformed-test-config.js');
      const malformedContent = `
        export default {
          inputType: 'asyncapi',
          // Missing required inputPath field
        };
      `;
      
      try {
        fs.writeFileSync(malformedConfig, malformedContent);
        
        const {error} = await runCommand(`generate ${malformedConfig}`);
        
        // Should produce an error about missing required fields
        expect(error).toBeDefined();
        expect(error?.message).toMatch(/Required|inputPath/i);
      } finally {
        // Cleanup
        if (fs.existsSync(malformedConfig)) {
          fs.unlinkSync(malformedConfig);
        }
      }
    });

    it('should handle errors with invalid input type', async () => {
      // Create a config with invalid input type to trigger error handling
      const testConfig = path.resolve(__dirname, '../configs/invalid-input-type-test.js');
      const testContent = `
        export default {
          inputType: 'invalid-type-that-does-not-exist',
          inputPath: './test-schema.yml',
          generators: [
            {
              preset: 'payloads',
              outputPath: './output'
            }
          ]
        };
      `;
      
      try {
        fs.writeFileSync(testConfig, testContent);
        
        const {error} = await runCommand(`generate ${testConfig}`);
        
        // Should produce an error about invalid input type
        expect(error).toBeDefined();
        expect(error?.message).toMatch(/EEXIT: 1|invalid/i);
      } finally {
        // Cleanup
        if (fs.existsSync(testConfig)) {
          fs.unlinkSync(testConfig);
        }
      }
    });

    it('should validate error handling code path is exercised', async () => {
      // Test that the error handling code path (lines 48-57) is exercised
      // by using an invalid preset which will cause generateWithConfig to throw
      const invalidPresetConfig = path.resolve(__dirname, '../configs/invalid-preset-test.js');
      const invalidContent = `
        export default {
          inputType: 'asyncapi',
          inputPath: './test-schema.yml',
          generators: [
            {
              preset: 'completely-invalid-preset-name',
              outputPath: './output'
            }
          ]
        };
      `;
      
      try {
        fs.writeFileSync(invalidPresetConfig, invalidContent);
        
        const {error} = await runCommand(`generate ${invalidPresetConfig}`);
        
        // The command should fail gracefully with an error
        expect(error).toBeDefined();
        expect(error?.message).toMatch(/Unable to determine default generator/i);
      } finally {
        // Cleanup
        if (fs.existsSync(invalidPresetConfig)) {
          fs.unlinkSync(invalidPresetConfig);
        }
      }
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
