/**
 * Tests for import extension configuration and utility functions.
 * Verifies that importExtension config produces correct imports for node16/nodenext moduleResolution.
 */
import {appendImportExtension} from '../../../../src/codegen/utils';
import {realizeConfiguration} from '../../../../src/codegen/configurations';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined)
}));

describe('Import Extension Configuration', () => {
  describe('appendImportExtension utility', () => {
    it('should return path unchanged when extension is "none"', () => {
      expect(appendImportExtension('./payloads/User', 'none')).toBe(
        './payloads/User'
      );
    });

    it('should append .ts when extension is ".ts"', () => {
      expect(appendImportExtension('./payloads/User', '.ts')).toBe(
        './payloads/User.ts'
      );
    });

    it('should append .js when extension is ".js"', () => {
      expect(appendImportExtension('./payloads/User', '.js')).toBe(
        './payloads/User.js'
      );
    });

    it('should handle paths with multiple segments', () => {
      expect(
        appendImportExtension('../models/types/UserProfile', '.ts')
      ).toBe('../models/types/UserProfile.ts');
    });

    it('should handle single-segment paths', () => {
      expect(appendImportExtension('./User', '.js')).toBe('./User.js');
    });
  });

  describe('configuration schema', () => {
    it('should accept root-level importExtension config', () => {
      const configuration: any = {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        language: 'typescript',
        importExtension: '.ts',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads'
          }
        ]
      };
      const realizedConfig = realizeConfiguration(configuration);
      expect(realizedConfig.importExtension).toBe('.ts');
    });

    it('should accept importExtension: ".js" in global config', () => {
      const configuration: any = {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        language: 'typescript',
        importExtension: '.js',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads'
          }
        ]
      };
      const realizedConfig = realizeConfiguration(configuration);
      expect(realizedConfig.importExtension).toBe('.js');
    });

    it('should accept importExtension: "none" in global config', () => {
      const configuration: any = {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        language: 'typescript',
        importExtension: 'none',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads'
          }
        ]
      };
      const realizedConfig = realizeConfiguration(configuration);
      expect(realizedConfig.importExtension).toBe('none');
    });

    it('should accept generator-level importExtension override', () => {
      const configuration: any = {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        language: 'typescript',
        importExtension: '.ts',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads',
            importExtension: 'none' // Override global
          }
        ]
      };
      const realizedConfig = realizeConfiguration(configuration);
      expect((realizedConfig.generators[0] as any).importExtension).toBe(
        'none'
      );
    });

    it('should work without importExtension config (backward compatibility)', () => {
      const configuration: any = {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads'
          }
        ]
      };
      // Should not throw
      const realizedConfig = realizeConfiguration(configuration);
      expect(realizedConfig.importExtension).toBeUndefined();
    });
  });

  describe('resolveImportExtension', () => {
    // These tests will be for the resolveImportExtension helper function
    it('should return generator importExtension when set', async () => {
      const {resolveImportExtension} = await import(
        '../../../../src/codegen/utils'
      );
      const config: any = {
        importExtension: '.ts'
      };
      const generator = {importExtension: '.js' as const};
      expect(resolveImportExtension(generator, config)).toBe('.js');
    });

    it('should return global importExtension when generator not set', async () => {
      const {resolveImportExtension} = await import(
        '../../../../src/codegen/utils'
      );
      const config: any = {
        importExtension: '.ts'
      };
      const generator = {};
      expect(resolveImportExtension(generator, config)).toBe('.ts');
    });

    it('should return "none" when neither generator nor global set', async () => {
      const {resolveImportExtension} = await import(
        '../../../../src/codegen/utils'
      );
      const config: any = {};
      const generator = {};
      expect(resolveImportExtension(generator, config)).toBe('none');
    });
  });
});
