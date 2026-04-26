/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-jasmine-globals */
import path from 'path';
import fs from 'fs';
import os from 'os';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');
const CONFIG_JSON = path.resolve(__dirname, '../configs/config.json');
const CONFIG_YAML = path.resolve(__dirname, '../configs/config.yaml');
const CONFIG_TS = path.resolve(__dirname, '../configs/config.ts');
const FULL_CONFIG = path.resolve(__dirname, '../configs/config-all.js');
import { loadAndRealizeConfigFile, loadConfigFile, realizeConfiguration, realizeGeneratorContext } from '../../src/codegen/configurations';
import { zodTheCodegenConfiguration } from '../../src/codegen/types';
import { Logger } from '../../src/LoggingInterface.ts';
import { detectTypeScriptImportExtension } from '../../src/codegen/detection';
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('configuration manager', () => {
  describe('loadConfigFile', () => {
    it('should throw descriptive error when specific config file not found', async () => {
      const nonExistentPath = path.resolve(__dirname, '../configs/non-existent-config.js');
      await expect(loadConfigFile(nonExistentPath)).rejects.toThrow(
        /Configuration file not found/i
      );
    });

    it('should throw descriptive error listing search locations when no path provided', async () => {
      // Save current directory and change to a directory with no config files
      const originalCwd = process.cwd();
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-test-'));
      
      try {
        process.chdir(emptyDir);
        await expect(loadConfigFile(undefined)).rejects.toThrow(
          /No configuration file found/i
        );
      } finally {
        process.chdir(originalCwd);
        // Clean up temporary directory
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('should successfully load valid config file', async () => {
      const { config } = await loadConfigFile(CONFIG_JSON);
      expect(config.inputType).toEqual('asyncapi');
    });
  });

  describe('loadAndRealizeConfigFile', () => {
    it('should work with correct ESM config', async () => {
      const { config } = await loadAndRealizeConfigFile(CONFIG_MJS);
      expect(config.inputType).toEqual('asyncapi');
    });
    it('should work with correct JSON config', async () => {
      const { config } = await loadAndRealizeConfigFile(CONFIG_JSON);
      expect(config.inputType).toEqual('asyncapi');
    });
    it('should work with correct YAML config', async () => {
      const { config } = await loadAndRealizeConfigFile(CONFIG_YAML);
      expect(config.inputType).toEqual('asyncapi');
    });
    // TypeScript config files require ts-node/tsx for dynamic imports.
    // This works at runtime (CLI with tsx), but Jest can't load TS files dynamically.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should work with correct TS config (requires ts-node/tsx runtime)', async () => {
      const { config } = await loadAndRealizeConfigFile(CONFIG_TS);
      expect(config.inputType).toEqual('asyncapi');
    });
    it('should work with full configuration', async () => {
      const { config } = await loadAndRealizeConfigFile(FULL_CONFIG);
      expect(config.inputType).toEqual('asyncapi');
    });
    it('should work with discover configuration', async () => {
      const { config } = await loadAndRealizeConfigFile(CONFIG_JSON);
      expect(config.inputType).toEqual('asyncapi');
    });
  });
  describe('realizeConfiguration', () => {
    it('should handle duplicate generators with no id', async () => {
      const configuration: any = {
        inputType: "asyncapi",
        inputPath: "asyncapi.json",
        language: "typescript",
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
          },
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
          }
        ]
      };
      const realizedConfiguration = realizeConfiguration(configuration);
      expect(realizedConfiguration.generators[0].id).toEqual('payloads-typescript');
      expect(realizedConfiguration.generators[1].id).toEqual('payloads-typescript-1');
    });

    it('should handle multiple duplicate generators with no id', async () => {
      const configuration: any = {
        inputType: "asyncapi",
        inputPath: "asyncapi.json",
        language: "typescript",
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
          },
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
          },
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
          }
        ]
      };
      const realizedConfiguration = realizeConfiguration(configuration);
      expect(realizedConfiguration.generators[0].id).toEqual('payloads-typescript');
      expect(realizedConfiguration.generators[1].id).toEqual('payloads-typescript-1');
      expect(realizedConfiguration.generators[2].id).toEqual('payloads-typescript-2');
    });

    it('should give errors on incorrect data', async () => {
      const configuration: any = {
        inputType: 123,
        inputPath: 123,
        generators: []
      };
      const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
      Logger.setLogger(logger);
      try {
        realizeConfiguration(configuration);
        fail('Should have failed realizing wrong configuration');
      } catch (e: any) {
        // Should log user-friendly error messages
        expect(logger.error).toHaveBeenCalled();
        const errorMessage = logger.error.mock.calls[0][0];
        expect(errorMessage).toMatch(/inputType|Invalid/i);
      }
    });
    describe('should handle default generators', () => {
      it('for channels', async () => {
        const configuration: any = {
          inputType: "asyncapi",
          inputPath: "asyncapi.json",
          language: "typescript",
          generators: [
            {
              preset: "channels",
              outputPath: "./src/__gen__/",
              protocols: ['nats']
            }
          ]
        };
        const realizedConfiguration = realizeConfiguration(configuration);
        expect(realizedConfiguration.generators.length).toEqual(4);
      });
      it('for client', async () => {
        const configuration: any = {
          inputType: "asyncapi",
          inputPath: "asyncapi.json",
          language: "typescript",
          generators: [
            {
              preset: "client",
              outputPath: "./src/__gen__/",
              protocols: ['nats']
            }
          ]
        };
        const realizedConfiguration = realizeConfiguration(configuration);
        expect(realizedConfiguration.generators.length).toEqual(5);
      });
      it('should overwrite protocols', async () => {
        const configuration: any = {
          inputType: "asyncapi",
          inputPath: "asyncapi.json",
          language: "typescript",
          generators: [
            {
              preset: "channels",
              outputPath: "./src/__gen__/",
              protocols: ['nats']
            }
          ]
        };
        const realizedConfiguration = realizeConfiguration(configuration);
        expect(realizedConfiguration.generators.length).toEqual(4);
      });
    });
  });

  describe('realizeGeneratorContext with detection', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-detection-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should apply detected importExtension when not explicitly set', async () => {
      // Create a tsconfig with node16 moduleResolution
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            moduleResolution: 'node16'
          }
        })
      );

      // Detect should return '.js' for node16 without allowImportingTsExtensions
      const detected = await detectTypeScriptImportExtension(tempDir);
      expect(detected).toBe('.js');
    });

    it('should detect bundler from vite dependency', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          devDependencies: {
            vite: '^5.0.0'
          }
        })
      );

      const detected = await detectTypeScriptImportExtension(tempDir);
      expect(detected).toBe('none');
    });

    it('should return null for classic node resolution (allowing default)', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test' })
      );
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            moduleResolution: 'node'
          }
        })
      );

      const detected = await detectTypeScriptImportExtension(tempDir);
      expect(detected).toBeNull();
    });

    it('should detect .ts extension when allowImportingTsExtensions is true', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            moduleResolution: 'nodenext',
            allowImportingTsExtensions: true
          }
        })
      );

      const detected = await detectTypeScriptImportExtension(tempDir);
      expect(detected).toBe('.ts');
    });
  });

  describe('remote URL inputPath passthrough', () => {
    let tempDir: string;
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-remote-url-'));
      fetchSpy = jest.spyOn(globalThis, 'fetch') as jest.SpyInstance;
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', properties: {} }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fetchSpy.mockRestore();
    });

    it('does not path.resolve a remote URL inputPath', async () => {
      const configPath = path.join(tempDir, 'codegen.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          inputType: 'jsonschema',
          inputPath: 'https://example.com/schema.json',
          language: 'typescript',
          generators: []
        })
      );

      const ctx = await realizeGeneratorContext(configPath);
      expect(ctx.documentPath).toBe('https://example.com/schema.json');
    });

    it('threads inputAuth onto the context for URL inputs', async () => {
      const configPath = path.join(tempDir, 'codegen.js');
      fs.writeFileSync(
        configPath,
        `module.exports = {
          inputType: 'jsonschema',
          inputPath: 'https://example.com/schema.json',
          language: 'typescript',
          auth: { type: 'bearer', token: 'tok' },
          generators: []
        };`
      );

      const ctx = await realizeGeneratorContext(configPath);
      expect(ctx.inputAuth).toEqual({ type: 'bearer', token: 'tok' });
      // Verify fetch saw the bearer header
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      const headers = new Headers(init.headers);
      expect(headers.get('authorization')).toBe('Bearer tok');
    });
  });

  describe('zodInputAuth shape', () => {
    const baseAsyncapi = {
      inputType: 'asyncapi' as const,
      inputPath: 'https://example.com/asyncapi.yaml',
      language: 'typescript' as const,
      generators: []
    };

    it('accepts no auth (undefined)', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({ ...baseAsyncapi })
      ).not.toThrow();
    });

    it('accepts bearer auth', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          ...baseAsyncapi,
          auth: { type: 'bearer', token: 'abc' }
        })
      ).not.toThrow();
    });

    it('accepts apiKey auth', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          ...baseAsyncapi,
          auth: { type: 'apiKey', header: 'X-API-Key', value: 'k' }
        })
      ).not.toThrow();
    });

    it('accepts custom headers auth', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          ...baseAsyncapi,
          auth: { type: 'custom', headers: { Authorization: 'Bearer abc' } }
        })
      ).not.toThrow();
    });

    it('rejects bearer auth missing token', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          ...baseAsyncapi,
          auth: { type: 'bearer' }
        })
      ).toThrow();
    });

    it('rejects unknown auth type', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          ...baseAsyncapi,
          auth: { type: 'oauth', token: 'abc' }
        })
      ).toThrow();
    });

    it('accepts auth on openapi input branch', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          inputType: 'openapi',
          inputPath: 'https://example.com/openapi.yaml',
          language: 'typescript',
          auth: { type: 'bearer', token: 'abc' },
          generators: []
        })
      ).not.toThrow();
    });

    it('accepts auth on jsonschema input branch', () => {
      expect(() =>
        zodTheCodegenConfiguration.parse({
          inputType: 'jsonschema',
          inputPath: 'https://example.com/schema.json',
          language: 'typescript',
          auth: { type: 'apiKey', header: 'X-API-Key', value: 'k' },
          generators: []
        })
      ).not.toThrow();
    });
  });
});
