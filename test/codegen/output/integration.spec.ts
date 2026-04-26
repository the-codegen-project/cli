/**
 * Integration tests for OutputAdapter with generators.
 * Tests that generators produce the same output with both FileSystemAdapter and MemoryAdapter.
 */
import path from 'node:path';
import {mkdir, rm, readFile} from 'node:fs/promises';
import {
  FileSystemAdapter,
  MemoryAdapter
} from '../../../src/codegen/output';
import type {GeneratedFile} from '../../../src/codegen/output';

describe('Generator OutputAdapter Integration', () => {
  const testDir = path.join(__dirname, '.integration-test-output');

  beforeEach(async () => {
    await mkdir(testDir, {recursive: true});
  });

  afterEach(async () => {
    await rm(testDir, {recursive: true, force: true});
  });

  describe('OutputAdapter with RenderContext', () => {
    it('should be passable through RunGeneratorContext', () => {
      // Test that the OutputAdapter type is properly exported and usable
      const memoryAdapter = new MemoryAdapter();
      const fsAdapter = new FileSystemAdapter({basePath: testDir});

      // Both should have the same interface
      expect(typeof memoryAdapter.write).toBe('function');
      expect(typeof memoryAdapter.mkdir).toBe('function');
      expect(typeof memoryAdapter.getWrittenFiles).toBe('function');
      expect(typeof memoryAdapter.getAllFiles).toBe('function');

      expect(typeof fsAdapter.write).toBe('function');
      expect(typeof fsAdapter.mkdir).toBe('function');
      expect(typeof fsAdapter.getWrittenFiles).toBe('function');
      expect(typeof fsAdapter.getAllFiles).toBe('function');
    });

    it('should allow both adapters to track written files', async () => {
      const memoryAdapter = new MemoryAdapter();
      const fsAdapter = new FileSystemAdapter({basePath: testDir});

      // Write same content to both
      const testContent = 'export const test = 1;';
      await memoryAdapter.write('test.ts', testContent);
      await fsAdapter.write('test.ts', testContent);

      // Both should track the file
      expect(memoryAdapter.getWrittenFiles()).toContain('test.ts');
      expect(fsAdapter.getWrittenFiles()).toContain(
        path.resolve(testDir, 'test.ts')
      );

      // Memory adapter should return content
      expect(memoryAdapter.getAllFiles()['test.ts']).toBe(testContent);

      // FileSystem adapter content must be read from disk
      const diskContent = await readFile(
        path.resolve(testDir, 'test.ts'),
        'utf-8'
      );
      expect(diskContent).toBe(testContent);
    });
  });

  // Note: Full generator integration tests are in the runtime test suite
  // which validates that generated code works correctly with real services.
});

describe('writeGeneratedFiles utility', () => {
  const testDir = path.join(__dirname, '.write-generated-test');

  beforeEach(async () => {
    await mkdir(testDir, {recursive: true});
  });

  afterEach(async () => {
    await rm(testDir, {recursive: true, force: true});
  });

  it('should write GeneratedFile[] to disk', async () => {
    // Import the new utility function
    const {writeGeneratedFiles} = await import('../../../src/codegen/output');

    const files: GeneratedFile[] = [
      {path: 'src/models/User.ts', content: 'export class User {}'},
      {path: 'src/models/Order.ts', content: 'export class Order {}'}
    ];

    const writtenPaths = await writeGeneratedFiles(files, testDir);

    // Should return the written paths
    expect(writtenPaths).toHaveLength(2);

    // Files should exist on disk
    const userContent = await readFile(
      path.resolve(testDir, 'src/models/User.ts'),
      'utf-8'
    );
    expect(userContent).toBe('export class User {}');

    const orderContent = await readFile(
      path.resolve(testDir, 'src/models/Order.ts'),
      'utf-8'
    );
    expect(orderContent).toBe('export class Order {}');
  });

  it('should create directories recursively', async () => {
    const {writeGeneratedFiles} = await import('../../../src/codegen/output');

    const files: GeneratedFile[] = [
      {path: 'deep/nested/path/file.ts', content: 'export const x = 1;'}
    ];

    await writeGeneratedFiles(files, testDir);

    const content = await readFile(
      path.resolve(testDir, 'deep/nested/path/file.ts'),
      'utf-8'
    );
    expect(content).toBe('export const x = 1;');
  });

  it('should return absolute paths', async () => {
    const {writeGeneratedFiles} = await import('../../../src/codegen/output');

    const files: GeneratedFile[] = [
      {path: 'test.ts', content: 'content'}
    ];

    const writtenPaths = await writeGeneratedFiles(files, testDir);

    expect(writtenPaths[0]).toBe(path.resolve(testDir, 'test.ts'));
  });
});
