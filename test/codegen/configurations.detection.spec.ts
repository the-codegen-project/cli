import path from 'path';
import fs from 'fs';
import os from 'os';
import { realizeGeneratorContext } from '../../src/codegen/configurations';
import { Logger } from '../../src/LoggingInterface';

// Mock node:fs/promises for writeFile and mkdir used in generator context
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('configurations.ts detection integration', () => {
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-config-detection-'));

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

  // Helper to write config file as JSON (Jest can't dynamically load ESM)
  const writeCodegenConfig = (dir: string, config: object) => {
    fs.writeFileSync(
      path.join(dir, 'codegen.json'),
      JSON.stringify(config, null, 2)
    );
    return path.join(dir, 'codegen.json');
  };

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

  // Helper to create a minimal asyncapi document
  const writeAsyncApiDoc = (dir: string) => {
    const doc = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      channels: {}
    };
    fs.writeFileSync(
      path.join(dir, 'asyncapi.json'),
      JSON.stringify(doc, null, 2)
    );
  };

  describe('detection integration with realizeGeneratorContext', () => {
    it('should auto-detect importExtension when not explicitly set', async () => {
      // Set up project with bundler
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
        // No importExtension set - should be auto-detected
      });

      const context = await realizeGeneratorContext(configPath);

      // Should have detected and applied importExtension
      expect(context.configuration.importExtension).toBe('none');
      // Logger.verbose() calls this.logger.info() internally when a custom logger is set
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Applied auto-detected importExtension')
      );
    });

    it('should NOT auto-detect when importExtension is explicitly set to "none"', async () => {
      // Set up project with node16 (would detect as .js)
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        importExtension: 'none', // Explicitly set
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      // Should use explicit value, not detected value
      expect(context.configuration.importExtension).toBe('none');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Using explicit importExtension')
      );
    });

    it('should NOT auto-detect when importExtension is explicitly set to ".ts"', async () => {
      // Set up project with bundler (would detect as none)
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        importExtension: '.ts', // Explicitly set
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      // Should use explicit value, not detected value
      expect(context.configuration.importExtension).toBe('.ts');
    });

    it('should NOT auto-detect when importExtension is explicitly set to ".js"', async () => {
      // Set up project with bundler (would detect as none)
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'bundler'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        importExtension: '.js', // Explicitly set
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      // Should use explicit value, not detected value
      expect(context.configuration.importExtension).toBe('.js');
    });

    it('should detect .ts for node16 with allowImportingTsExtensions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16',
          allowImportingTsExtensions: true
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      expect(context.configuration.importExtension).toBe('.ts');
    });

    it('should detect .js for node16 without allowImportingTsExtensions', async () => {
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      expect(context.configuration.importExtension).toBe('.js');
    });

    it('should detect "none" when bundler is present', async () => {
      writePackageJson(tempDir, {
        devDependencies: {
          vite: '^5.0.0'
        }
      });
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      expect(context.configuration.importExtension).toBe('none');
    });

    it('should leave importExtension undefined when detection fails', async () => {
      // No tsconfig.json, no package.json with bundler
      writeAsyncApiDoc(tempDir);
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      // Should remain undefined (not set, will use default 'none' at usage time)
      expect(context.configuration.importExtension).toBeUndefined();
    });
  });

  describe('priority resolution', () => {
    it('should respect priority: explicit global > detected', async () => {
      // Set up detection to return '.js' (node16 without allowImportingTsExtensions)
      writeTsConfig(tempDir, {
        compilerOptions: {
          moduleResolution: 'node16'
        }
      });
      writeAsyncApiDoc(tempDir);

      // But explicit config says 'none'
      const configPath = writeCodegenConfig(tempDir, {
        inputType: 'asyncapi',
        inputPath: './asyncapi.json',
        language: 'typescript',
        importExtension: 'none', // Explicit override
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payloads'
          }
        ]
      });

      const context = await realizeGeneratorContext(configPath);

      // Explicit should win over detected
      expect(context.configuration.importExtension).toBe('none');
    });
  });
});
