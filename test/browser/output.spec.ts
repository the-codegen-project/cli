/**
 * Tests for BrowserOutput adapter.
 * Verifies in-memory file storage for browser environments.
 */
import {BrowserOutput} from '../../src/browser/adapters/output';

describe('BrowserOutput', () => {
  let output: BrowserOutput;

  beforeEach(() => {
    output = new BrowserOutput();
  });

  describe('write', () => {
    it('should write a single file to memory', () => {
      output.write('src/models/User.ts', 'export class User {}');

      expect(output.read('src/models/User.ts')).toBe('export class User {}');
    });

    it('should write multiple files preserving directory structure', () => {
      output.write('src/models/User.ts', 'export class User {}');
      output.write('src/models/Order.ts', 'export class Order {}');
      output.write('src/index.ts', 'export * from "./models/User";');

      const files = output.getAll();
      expect(Object.keys(files)).toHaveLength(3);
      expect(files['src/models/User.ts']).toBe('export class User {}');
      expect(files['src/models/Order.ts']).toBe('export class Order {}');
      expect(files['src/index.ts']).toBe('export * from "./models/User";');
    });

    it('should overwrite existing files', () => {
      output.write('src/models/User.ts', 'export class User {}');
      output.write('src/models/User.ts', 'export class User { name: string; }');

      expect(output.read('src/models/User.ts')).toBe(
        'export class User { name: string; }'
      );
    });

    it('should handle files with different directory depths', () => {
      output.write('index.ts', 'export * from "./src";');
      output.write('src/index.ts', 'export * from "./models";');
      output.write('src/models/index.ts', 'export * from "./User";');
      output.write('src/models/types/UserType.ts', 'export type UserType = {};');

      const files = output.getAll();
      expect(Object.keys(files)).toHaveLength(4);
    });
  });

  describe('read', () => {
    it('should return undefined for non-existent files', () => {
      expect(output.read('non/existent/file.ts')).toBeUndefined();
    });

    it('should read back written files', () => {
      const content = `export interface User {
  id: string;
  name: string;
}`;
      output.write('src/types.ts', content);

      expect(output.read('src/types.ts')).toBe(content);
    });
  });

  describe('getAll', () => {
    it('should return empty object when no files written', () => {
      expect(output.getAll()).toEqual({});
    });

    it('should return all files as Record<string, string>', () => {
      output.write('a.ts', 'a content');
      output.write('b.ts', 'b content');

      const files = output.getAll();
      expect(files).toEqual({
        'a.ts': 'a content',
        'b.ts': 'b content'
      });
    });

    it('should return a copy, not the internal state', () => {
      output.write('test.ts', 'content');

      const files = output.getAll();
      files['test.ts'] = 'modified';

      // Original should not be modified
      expect(output.read('test.ts')).toBe('content');
    });
  });

  describe('clear', () => {
    it('should remove all files', () => {
      output.write('a.ts', 'a');
      output.write('b.ts', 'b');

      output.clear();

      expect(output.getAll()).toEqual({});
      expect(output.read('a.ts')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing files', () => {
      output.write('test.ts', 'content');

      expect(output.has('test.ts')).toBe(true);
    });

    it('should return false for non-existent files', () => {
      expect(output.has('nonexistent.ts')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove a specific file', () => {
      output.write('a.ts', 'a');
      output.write('b.ts', 'b');

      output.delete('a.ts');

      expect(output.has('a.ts')).toBe(false);
      expect(output.has('b.ts')).toBe(true);
    });

    it('should return true if file was deleted', () => {
      output.write('test.ts', 'content');

      expect(output.delete('test.ts')).toBe(true);
    });

    it('should return false if file did not exist', () => {
      expect(output.delete('nonexistent.ts')).toBe(false);
    });
  });

  describe('getPaths', () => {
    it('should return all file paths', () => {
      output.write('src/a.ts', 'a');
      output.write('src/b.ts', 'b');
      output.write('index.ts', 'index');

      const paths = output.getPaths();
      expect(paths).toHaveLength(3);
      expect(paths).toContain('src/a.ts');
      expect(paths).toContain('src/b.ts');
      expect(paths).toContain('index.ts');
    });

    it('should return empty array when no files', () => {
      expect(output.getPaths()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return the number of files', () => {
      expect(output.size).toBe(0);

      output.write('a.ts', 'a');
      expect(output.size).toBe(1);

      output.write('b.ts', 'b');
      expect(output.size).toBe(2);
    });
  });
});
