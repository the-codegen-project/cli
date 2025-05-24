import { runCommand } from '@oclif/test';

describe('init', () => {
  describe('configuration types', () => {
    it('should generate esm configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate typescript configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=ts --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate json configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate yaml configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=yaml --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });
  });

  describe('include flags', () => {
    it('should generate configuration with headers', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-headers`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate configuration with payloads', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-payloads`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate configuration with parameters', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-parameters`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate configuration with channels', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-channels`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate configuration with client', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-client`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate configuration with all include flags', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-headers --include-payloads --include-parameters --include-channels --include-client`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });
  });

  describe('input types', () => {
    it('should handle asyncapi input type', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should handle openapi input type', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./openapi.json' --input-type=openapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });
  });

  describe('configuration options', () => {
    it('should use custom config name', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --config-name=my-custom-config --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should use custom output directory', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./custom-output' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).not.toEqual('');
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should generate correct file extensions for different config types', async () => {
      // Test ESM (.mjs)
      const esmResult = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(esmResult.stdout).toContain('.mjs');

      // Test TypeScript (.ts)
      const tsResult = await runCommand(`init --config-type=ts --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(tsResult.stdout).toContain('.ts');

      // Test JSON (.json)
      const jsonResult = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(jsonResult.stdout).toContain('.json');

      // Test YAML (.yaml)
      const yamlResult = await runCommand(`init --config-type=yaml --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(yamlResult.stdout).toContain('.yaml');
    });
  });

  describe('configuration content validation', () => {
    it('should include correct language in configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"language": "typescript"');
    });

    it('should include schema reference in JSON configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"$schema": "https://raw.githubusercontent.com/the-codegen-project/cli/main/schemas/configuration-schema-0.json"');
    });

    it('should include schema reference in YAML configuration', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=yaml --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('# yaml-language-server: $schema=https://raw.githubusercontent.com/the-codegen-project/cli/main/schemas/configuration-schema-0.json');
    });

    it('should have empty generators array when no include flags are specified', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"generators": []');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing input-file flag gracefully in non-interactive mode', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      // The command should still run, but the inputFile will be undefined
      expect(error).toBeUndefined();
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should handle missing input-type flag gracefully in non-interactive mode', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --languages=typescript --no-tty --output-directory='./' --no-output`);
      // The command should still run, but the inputType will be undefined
      expect(error).toBeUndefined();
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });

    it('should handle missing languages flag gracefully in non-interactive mode', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --no-tty --output-directory='./' --no-output`);
      // The command should still run, but the languages will be undefined
      expect(error).toBeUndefined();
      expect(stdout).toContain('Successfully created your sparkling new generation file');
    });
  });

  describe('flag combinations and restrictions', () => {
    it('should only include TypeScript-specific generators for TypeScript language', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-payloads`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"generators"');
      expect(stdout).toContain('"language": "typescript"');
    });

    it('should only include AsyncAPI-specific generators for AsyncAPI input type', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-channels`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"inputType": "asyncapi"');
      expect(stdout).toContain('"generators"');
    });

    it('should handle OpenAPI with TypeScript but no AsyncAPI-specific features', async () => {
      const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./openapi.json' --input-type=openapi --languages=typescript --no-tty --output-directory='./' --no-output`);
      expect(error).toBeUndefined();
      expect(stderr).toEqual('');
      expect(stdout).toContain('"inputType": "openapi"');
      expect(stdout).toContain('"generators": []'); // No AsyncAPI-specific generators should be added
    });
  });
});
