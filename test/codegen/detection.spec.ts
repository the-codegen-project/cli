import path from 'path';
import { detectTypeScriptImportExtension } from '../../src/codegen/detection';

const FIXTURES = path.resolve(__dirname, '../configs/detection');

describe('detectTypeScriptImportExtension', () => {
  describe('bundler detection via config files', () => {
    it('should return "none" when vite.config.ts exists', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'bundler-config-file')
      );
      expect(result).toBe('none');
    });
  });

  describe('bundler detection via package.json dependencies', () => {
    it('should return "none" when vite is in devDependencies', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'bundler-vite')
      );
      expect(result).toBe('none');
    });

    it('should return "none" when webpack is in devDependencies', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'bundler-webpack')
      );
      expect(result).toBe('none');
    });
  });

  describe('tsconfig moduleResolution detection', () => {
    it('should return "none" for moduleResolution: bundler', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'module-resolution-bundler')
      );
      expect(result).toBe('none');
    });

    it('should return ".ts" for node16 with allowImportingTsExtensions', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'node16-with-ts')
      );
      expect(result).toBe('.ts');
    });

    it('should return ".js" for node16 without allowImportingTsExtensions', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'node16-without-ts')
      );
      expect(result).toBe('.js');
    });

    it('should return ".ts" for nodenext with allowImportingTsExtensions', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'nodenext-with-ts')
      );
      expect(result).toBe('.ts');
    });

    it('should return ".js" for nodenext without allowImportingTsExtensions', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'nodenext-without-ts')
      );
      expect(result).toBe('.js');
    });

    it('should return null for classic node moduleResolution', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'classic-node')
      );
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should return null when tsconfig not found', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'no-tsconfig')
      );
      expect(result).toBeNull();
    });

    it('should return null when directory does not exist', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'nonexistent-directory')
      );
      expect(result).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'invalid-json')
      );
      expect(result).toBeNull();
    });

    it('should return null for empty directory', async () => {
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'empty')
      );
      expect(result).toBeNull();
    });

    it('should not throw on any error condition', async () => {
      await expect(
        detectTypeScriptImportExtension(path.join(FIXTURES, 'invalid-json'))
      ).resolves.not.toThrow();

      await expect(
        detectTypeScriptImportExtension(path.join(FIXTURES, 'nonexistent-directory'))
      ).resolves.not.toThrow();
    });
  });

  describe('detection priority', () => {
    it('should prioritize bundler config file over bundler dependency (bundler-vite has both)', async () => {
      // bundler-vite has vite in devDependencies AND moduleResolution: bundler
      // Detection should work regardless of which check triggers first
      const result = await detectTypeScriptImportExtension(
        path.join(FIXTURES, 'bundler-vite')
      );
      expect(result).toBe('none');
    });
  });
});
