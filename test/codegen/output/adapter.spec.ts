/**
 * Unit tests for OutputAdapter implementations.
 * Tests both FileSystemAdapter (CLI) and MemoryAdapter (browser) implementations.
 */
import path from 'node:path';
import {mkdir, rm, readFile} from 'node:fs/promises';
import {
  OutputAdapter,
  FileSystemAdapter,
  MemoryAdapter
} from '../../../src/codegen/output';

describe('OutputAdapter', () => {
  describe('FileSystemAdapter', () => {
    const testDir = path.join(__dirname, '.test-output');
    let adapter: FileSystemAdapter;

    beforeEach(async () => {
      // Create a fresh test directory
      await mkdir(testDir, {recursive: true});
      adapter = new FileSystemAdapter({basePath: testDir});
    });

    afterEach(async () => {
      // Clean up test directory
      await rm(testDir, {recursive: true, force: true});
    });

    it('should write files to disk', async () => {
      const filePath = 'test-file.ts';
      const content = 'export const test = "hello";';

      await adapter.write(filePath, content);

      const actualPath = path.resolve(testDir, filePath);
      const actualContent = await readFile(actualPath, 'utf-8');
      expect(actualContent).toBe(content);
    });

    it('should create directories recursively', async () => {
      const dirPath = 'nested/deep/directory';

      await adapter.mkdir(dirPath, {recursive: true});

      // Verify directory exists by writing a file to it
      const filePath = path.join(dirPath, 'test.ts');
      await adapter.write(filePath, 'test');
      const actualPath = path.resolve(testDir, filePath);
      const actualContent = await readFile(actualPath, 'utf-8');
      expect(actualContent).toBe('test');
    });

    it('should track written files', async () => {
      await adapter.write('file1.ts', 'content1');
      await adapter.write('file2.ts', 'content2');
      await adapter.write('nested/file3.ts', 'content3');

      const writtenFiles = adapter.getWrittenFiles();
      expect(writtenFiles).toHaveLength(3);
      expect(writtenFiles).toContain(path.resolve(testDir, 'file1.ts'));
      expect(writtenFiles).toContain(path.resolve(testDir, 'file2.ts'));
      expect(writtenFiles).toContain(path.resolve(testDir, 'nested/file3.ts'));
    });

    it('should return empty object from getAllFiles (not supported for filesystem)', () => {
      const files = adapter.getAllFiles();
      expect(files).toEqual({});
    });

    it('should resolve relative paths from basePath', async () => {
      const content = 'export const x = 1;';
      await adapter.write('src/models/User.ts', content);

      const actualPath = path.resolve(testDir, 'src/models/User.ts');
      const actualContent = await readFile(actualPath, 'utf-8');
      expect(actualContent).toBe(content);
    });

    it('should handle absolute paths', async () => {
      const absolutePath = path.join(testDir, 'absolute', 'path.ts');
      const content = 'export const y = 2;';

      // When given an absolute path, it should use it directly
      await adapter.mkdir(path.dirname(absolutePath), {recursive: true});
      await adapter.write(absolutePath, content);

      const actualContent = await readFile(absolutePath, 'utf-8');
      expect(actualContent).toBe(content);
    });
  });

  describe('MemoryAdapter', () => {
    let adapter: MemoryAdapter;

    beforeEach(() => {
      adapter = new MemoryAdapter();
    });

    it('should store files in memory', async () => {
      const filePath = 'src/models/User.ts';
      const content = 'export interface User { name: string; }';

      await adapter.write(filePath, content);

      expect(adapter.read(filePath)).toBe(content);
    });

    it('should return all files', async () => {
      await adapter.write('file1.ts', 'content1');
      await adapter.write('file2.ts', 'content2');

      const files = adapter.getAllFiles();
      expect(files).toEqual({
        'file1.ts': 'content1',
        'file2.ts': 'content2'
      });
    });

    it('should handle nested paths', async () => {
      await adapter.write('src/deep/nested/file.ts', 'nested content');

      const files = adapter.getAllFiles();
      expect(files['src/deep/nested/file.ts']).toBe('nested content');
    });

    it('should track written files', async () => {
      await adapter.write('a.ts', 'a');
      await adapter.write('b.ts', 'b');

      const writtenFiles = adapter.getWrittenFiles();
      expect(writtenFiles).toHaveLength(2);
      expect(writtenFiles).toContain('a.ts');
      expect(writtenFiles).toContain('b.ts');
    });

    it('should have no-op mkdir', async () => {
      // mkdir should not throw and should be a no-op
      await expect(
        adapter.mkdir('some/directory', {recursive: true})
      ).resolves.not.toThrow();
    });

    it('should support clear()', async () => {
      await adapter.write('file.ts', 'content');
      expect(adapter.size).toBe(1);

      adapter.clear();
      expect(adapter.size).toBe(0);
    });

    it('should support has()', async () => {
      expect(adapter.has('file.ts')).toBe(false);

      await adapter.write('file.ts', 'content');
      expect(adapter.has('file.ts')).toBe(true);
    });

    it('should handle basePath option', async () => {
      const adapterWithBase = new MemoryAdapter({basePath: 'output'});

      await adapterWithBase.write('file.ts', 'content');

      const files = adapterWithBase.getAllFiles();
      expect(files['output/file.ts']).toBe('content');
    });

    it('should normalize paths with basePath', async () => {
      const adapterWithBase = new MemoryAdapter({basePath: 'output/'});

      await adapterWithBase.write('file.ts', 'content');

      const files = adapterWithBase.getAllFiles();
      // Should not have double slashes
      expect(files['output/file.ts']).toBe('content');
    });
  });

  describe('Interface Compliance', () => {
    it('FileSystemAdapter implements OutputAdapter interface', () => {
      const adapter: OutputAdapter = new FileSystemAdapter();
      expect(adapter.write).toBeDefined();
      expect(adapter.mkdir).toBeDefined();
      expect(adapter.getWrittenFiles).toBeDefined();
      expect(adapter.getAllFiles).toBeDefined();
    });

    it('MemoryAdapter implements OutputAdapter interface', () => {
      const adapter: OutputAdapter = new MemoryAdapter();
      expect(adapter.write).toBeDefined();
      expect(adapter.mkdir).toBeDefined();
      expect(adapter.getWrittenFiles).toBeDefined();
      expect(adapter.getAllFiles).toBeDefined();
    });
  });
});
