import path from 'path';
import fs from 'fs';
import os from 'os';
import { detectImportExtension } from '../../src/codegen/detection';
import { Logger } from '../../src/LoggingInterface';

describe('detectImportExtension', () => {
  let tempDir: string;
  let mockLogger: {
    error: jest.Mock;
    warn: jest.Mock;
    info: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  beforeEach(() => {
    // Create a fresh temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-detection-test-'));

    // Set up mock logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };
    Logger.setLogger(mockLogger);
    // Enable all log levels so we can capture debug/verbose messages
    Logger.setLevel('debug');
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Helper to create a fake config file path
  const createConfigPath = (dir: string = tempDir) => path.join(dir, 'codegen.mjs');

  // Helper to write tsconfig.json
  const writeTsConfig = (dir: string, config: object) => {
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(config, null, 2)
    );
  };

  // Helper to write package.json
  const writePackageJson = (dir: string, config: object) => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify(config, null, 2)
    );
  };

  describe('tsconfig.json detection', () => {
    it('should return undefined when no tsconfig.json found', async () => {
      // No tsconfig.json in temp directory
      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });

    it('should return "none" for moduleResolution: "bundler"', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" for moduleResolution: "Bundler" (case insensitive)', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'Bundler'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" for moduleResolution: "node" (classic)', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" for moduleResolution: "node10"', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node10'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" for moduleResolution: "classic"', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'classic'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return ".ts" for moduleResolution: "node16" with allowImportingTsExtensions: true', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16',
          allowImportingTsExtensions: true
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.ts');
    });

    it('should return ".ts" for moduleResolution: "nodenext" with allowImportingTsExtensions: true', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'nodenext',
          allowImportingTsExtensions: true
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.ts');
    });

    it('should return ".ts" for moduleResolution: "NodeNext" (case insensitive) with allowImportingTsExtensions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'NodeNext',
          allowImportingTsExtensions: true
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.ts');
    });

    it('should return ".js" for moduleResolution: "node16" without allowImportingTsExtensions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.js');
    });

    it('should return ".js" for moduleResolution: "nodenext" without allowImportingTsExtensions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'nodenext'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.js');
    });

    it('should return ".js" for moduleResolution: "node16" with allowImportingTsExtensions: false', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16',
          allowImportingTsExtensions: false
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.js');
    });
  });

  describe('tsconfig.json with extends', () => {
    it('should resolve extends from local relative path', async () => {
      // Create base config
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16',
          allowImportingTsExtensions: true
        }
      });

      // Create child directory with extending config
      const childDir = path.join(tempDir, 'child');
      fs.mkdirSync(childDir);
      writeTsConfig(childDir, {
        extends: '../tsconfig.json'
      });

      const result = await detectImportExtension(path.join(childDir, 'codegen.mjs'));
      expect(result).toBe('.ts');
    });

    it('should override parent settings with child settings', async () => {
      // Create base config with node16
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });

      // Create child directory that adds allowImportingTsExtensions
      const childDir = path.join(tempDir, 'child');
      fs.mkdirSync(childDir);
      writeTsConfig(childDir, {
        extends: '../tsconfig.json',
        compilerOptions: {
          allowImportingTsExtensions: true
        }
      });

      const result = await detectImportExtension(path.join(childDir, 'codegen.mjs'));
      expect(result).toBe('.ts');
    });

    it('should handle extends to npm package gracefully (use local config only)', async () => {
      // Create config that extends an npm package (won't be found)
      writeTsConfig(tempDir, {
        extends: '@tsconfig/node18/tsconfig.json',
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should handle extends without .json extension', async () => {
      // Create base config
      fs.writeFileSync(
        path.join(tempDir, 'base.json'),
        JSON.stringify({
          compilerOptions: {
            moduleResolution: 'node16',
            allowImportingTsExtensions: true
          }
        })
      );

      // Create child config extending without .json
      writeTsConfig(tempDir, {
        extends: './base'
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('.ts');
    });
  });

  describe('directory tree search', () => {
    it('should search up directory tree for tsconfig.json', async () => {
      // Put tsconfig in parent directory
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      // Create nested directory for config
      const nestedDir = path.join(tempDir, 'src', 'generated');
      fs.mkdirSync(nestedDir, { recursive: true });

      const result = await detectImportExtension(path.join(nestedDir, 'codegen.mjs'));
      expect(result).toBe('none');
    });

    it('should use closest tsconfig.json in tree', async () => {
      // Put tsconfig with bundler in root
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      // Put different tsconfig in nested dir
      const nestedDir = path.join(tempDir, 'src');
      fs.mkdirSync(nestedDir, { recursive: true });
      writeTsConfig(nestedDir, {
        compilerOptions: {
          moduleResolution: 'nodenext'
        }
      });

      // Config is in the nested directory
      const result = await detectImportExtension(path.join(nestedDir, 'codegen.mjs'));
      expect(result).toBe('.js'); // nodenext without allowImportingTsExtensions
    });
  });

  describe('package.json bundler detection', () => {
    it('should return "none" when vite is in devDependencies', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          vite: '^5.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" when webpack is in devDependencies', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          webpack: '^5.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" when esbuild is in devDependencies', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          esbuild: '^0.20.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" when rollup is in dependencies', async () => {
      writePackageJson(tempDir, {
        dependencies: {
          rollup: '^4.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" when parcel is in devDependencies', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          parcel: '^2.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should return "none" when turbopack is in devDependencies', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          turbopack: '^1.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should prioritize bundler detection over tsconfig settings', async () => {
      // Even with node16 tsconfig, bundler presence takes precedence
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });
      writePackageJson(tempDir, {
        devDependencies: {
          vite: '^5.0.0'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });
  });

  describe('error handling', () => {
    it('should return undefined for malformed tsconfig.json', async () => {
      // Write invalid JSON
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        '{ invalid json }'
      );

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty tsconfig.json', async () => {
      fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), '');

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });

    it('should handle tsconfig with comments (JSONC)', async () => {
      // Write tsconfig with comments
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        `{
          // This is a comment
          "compilerOptions": {
            /* Multi-line
               comment */
            "moduleResolution": "bundler"
          }
        }`
      );

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should handle tsconfig with $schema URL containing //', async () => {
      // Regression test: ensure // in URLs is not treated as a comment
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        `{
          "$schema": "https://json.schemastore.org/tsconfig",
          "compilerOptions": {
            "moduleResolution": "bundler"
          }
        }`
      );

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should handle tsconfig with URLs and comments', async () => {
      // Combined test: URLs with // and actual comments
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        `{
          "$schema": "https://json.schemastore.org/tsconfig", // Schema URL
          "compilerOptions": {
            /* Configuration for bundler mode */
            "moduleResolution": "bundler"
          }
        }`
      );

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBe('none');
    });

    it('should handle malformed package.json gracefully', async () => {
      // Write invalid JSON
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        '{ invalid json }'
      );

      // Should still work (fall back to tsconfig or undefined)
      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });

    it('should handle missing compilerOptions in tsconfig', async () => {
      writeTsConfig(tempDir, {
        // No compilerOptions
        include: ['src/**/*']
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });
  });

  describe('logging', () => {
    it('should log verbose message when detection succeeds', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      await detectImportExtension(createConfigPath());

      // Logger.verbose() calls this.logger.info() internally when a custom logger is set
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Auto-detected importExtension')
      );
    });

    it('should log debug message when tsconfig.json is found', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });

      await detectImportExtension(createConfigPath());

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found tsconfig.json')
      );
    });

    it('should log debug message when bundler is detected', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          vite: '^5.0.0'
        }
      });

      await detectImportExtension(createConfigPath());

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found bundler')
      );
    });
  });

  describe('edge cases', () => {
    it('should return undefined when tsconfig has unknown moduleResolution', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'unknown-resolution'
        }
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });

    it('should handle deeply nested extends chain', async () => {
      // Create a chain: child -> parent -> grandparent
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });

      const parentDir = path.join(tempDir, 'parent');
      fs.mkdirSync(parentDir);
      writeTsConfig(parentDir, {
        extends: '../tsconfig.json',
        compilerOptions: {
          // Inherits moduleResolution from grandparent
        }
      });

      const childDir = path.join(parentDir, 'child');
      fs.mkdirSync(childDir);
      writeTsConfig(childDir, {
        extends: '../tsconfig.json',
        compilerOptions: {
          allowImportingTsExtensions: true
        }
      });

      const result = await detectImportExtension(path.join(childDir, 'codegen.mjs'));
      expect(result).toBe('.ts');
    });

    it('should handle tsconfig with only empty compilerOptions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {}
      });

      const result = await detectImportExtension(createConfigPath());
      expect(result).toBeUndefined();
    });
  });
});
