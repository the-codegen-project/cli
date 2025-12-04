import {updateGitignore, collectOutputPaths} from '../../src/utils/gitignore';
import {readFile, writeFile, unlink, mkdir} from 'node:fs/promises';
import path from 'path';
import {existsSync} from 'fs';

// Helper to create a temporary test directory
const TEST_DIR = path.join(__dirname, '.test-gitignore');

describe('gitignore utilities', () => {
  beforeEach(async () => {
    // Create test directory if it doesn't exist
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, {recursive: true});
    }
  });

  afterEach(async () => {
    // Clean up test .gitignore file
    const gitignorePath = path.join(TEST_DIR, '.gitignore');
    try {
      await unlink(gitignorePath);
    } catch {
      // Ignore errors if file doesn't exist
    }
  });

  describe('updateGitignore', () => {
    describe('when .gitignore does not exist', () => {
      it('should create .gitignore with output paths', async () => {
        const outputPaths = ['src/__gen__/payloads', 'src/__gen__/channels'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');
        expect(result.message).toBe('Created .gitignore with generated output directories');
        expect(result.addedPaths).toEqual(outputPaths);

        // Verify file was created with correct content
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const content = await readFile(gitignorePath, 'utf-8');
        expect(content).toContain('# The Codegen Project - generated files');
        expect(content).toContain('src/__gen__/payloads');
        expect(content).toContain('src/__gen__/channels');
      });

      it('should create .gitignore with custom comment header', async () => {
        const outputPaths = ['src/__gen__/payloads'];
        const customHeader = '# Custom Generator Files';
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR,
          commentHeader: customHeader
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');

        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const content = await readFile(gitignorePath, 'utf-8');
        expect(content).toContain(customHeader);
        expect(content).not.toContain('# The Codegen Project - generated files');
      });

      it('should create .gitignore with single path', async () => {
        const outputPaths = ['src/__gen__/payloads'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');
        expect(result.addedPaths).toEqual(outputPaths);
      });
    });

    describe('when .gitignore exists', () => {
      it('should append new paths to existing .gitignore', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const existingContent = '# Existing content\nnode_modules/\n';
        await writeFile(gitignorePath, existingContent);

        const outputPaths = ['src/__gen__/payloads', 'src/__gen__/channels'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('updated');
        expect(result.message).toContain('Added 2 output directories to .gitignore');
        expect(result.addedPaths).toEqual(outputPaths);

        const content = await readFile(gitignorePath, 'utf-8');
        expect(content).toContain(existingContent);
        expect(content).toContain('# The Codegen Project - generated files');
        expect(content).toContain('src/__gen__/payloads');
        expect(content).toContain('src/__gen__/channels');
      });

      it('should handle existing .gitignore without trailing newline', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        await writeFile(gitignorePath, 'node_modules/');

        const outputPaths = ['src/__gen__/payloads'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('updated');

        const content = await readFile(gitignorePath, 'utf-8');
        // Should add proper newlines
        expect(content).toMatch(/node_modules\/\n\n# The Codegen Project/);
      });

      it('should skip paths that already exist in .gitignore', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const existingContent = 'node_modules/\nsrc/__gen__/payloads\n';
        await writeFile(gitignorePath, existingContent);

        const outputPaths = ['src/__gen__/payloads', 'src/__gen__/channels'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('updated');
        expect(result.message).toContain('Added 1 output directory to .gitignore');
        expect(result.addedPaths).toEqual(['src/__gen__/channels']);

        const content = await readFile(gitignorePath, 'utf-8');
        // Should only appear once
        expect(content.match(/src\/__gen__\/payloads/g)?.length).toBe(1);
      });

      it('should skip when all paths already exist', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const existingContent = 'src/__gen__/payloads\nsrc/__gen__/channels\n';
        await writeFile(gitignorePath, existingContent);

        const outputPaths = ['src/__gen__/payloads', 'src/__gen__/channels'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('skipped');
        expect(result.message).toContain('All output directories already present in .gitignore');
        expect(result.addedPaths).toEqual([]);

        // File should not be modified
        const content = await readFile(gitignorePath, 'utf-8');
        expect(content).toBe(existingContent);
      });

      it('should use singular form for single directory', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        await writeFile(gitignorePath, 'node_modules/\n');

        const outputPaths = ['src/__gen__/payloads'];
        const result = await updateGitignore(outputPaths, {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.message).toContain('Added 1 output directory to .gitignore');
      });
    });

    describe('error handling', () => {
      it('should handle write errors gracefully for invalid paths', async () => {
        // Test with a path that doesn't exist
        const result = await updateGitignore(['src/__gen__/payloads'], {
          baseDirectory: '/nonexistent/invalid/path/that/will/fail'
        });

        expect(result.success).toBe(false);
        expect(result.action).toBe('error');
        expect(result.message).toContain('Could not');
        expect(result.error).toBeDefined();
      });
    });

    describe('with empty paths array', () => {
      it('should create empty .gitignore with header when file does not exist', async () => {
        const result = await updateGitignore([], {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');
        expect(result.addedPaths).toEqual([]);

        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        const content = await readFile(gitignorePath, 'utf-8');
        expect(content).toContain('# The Codegen Project - generated files');
      });

      it('should skip when file exists and paths array is empty', async () => {
        const gitignorePath = path.join(TEST_DIR, '.gitignore');
        await writeFile(gitignorePath, 'node_modules/\n');

        const result = await updateGitignore([], {
          baseDirectory: TEST_DIR
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('skipped');
        expect(result.addedPaths).toEqual([]);
      });
    });
  });

  describe('collectOutputPaths', () => {
    it('should collect output paths from generator configs', () => {
      const generatorConfigs = {
        payloads: {outputPath: 'src/__gen__/payloads'},
        channels: {outputPath: 'src/__gen__/channels'},
        headers: {outputPath: 'src/__gen__/headers'}
      };

      const result = collectOutputPaths(generatorConfigs);

      expect(result).toEqual([
        'src/__gen__/payloads',
        'src/__gen__/channels',
        'src/__gen__/headers'
      ]);
    });

    it('should handle undefined configs', () => {
      const generatorConfigs = {
        payloads: {outputPath: 'src/__gen__/payloads'},
        channels: undefined,
        headers: {outputPath: 'src/__gen__/headers'}
      };

      const result = collectOutputPaths(generatorConfigs);

      expect(result).toEqual([
        'src/__gen__/payloads',
        'src/__gen__/headers'
      ]);
    });

    it('should return empty array for empty configs', () => {
      const result = collectOutputPaths({});

      expect(result).toEqual([]);
    });

    it('should handle all undefined configs', () => {
      const generatorConfigs = {
        payloads: undefined,
        channels: undefined,
        headers: undefined
      };

      const result = collectOutputPaths(generatorConfigs);

      expect(result).toEqual([]);
    });

    it('should preserve order of output paths', () => {
      const generatorConfigs = {
        first: {outputPath: 'path1'},
        second: {outputPath: 'path2'},
        third: {outputPath: 'path3'}
      };

      const result = collectOutputPaths(generatorConfigs);

      expect(result).toEqual(['path1', 'path2', 'path3']);
    });
  });
});

