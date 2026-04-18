/* eslint-disable security/detect-object-injection */
/**
 * In-memory file output adapter for browser environments.
 * Replaces filesystem writes with Map<string, string> storage.
 * Implements OutputAdapter interface for compatibility with shared generators.
 */
import {OutputAdapter} from '../../codegen/output/types';

export class BrowserOutput implements OutputAdapter {
  private files: Map<string, string> = new Map();

  /**
   * Write a file to memory.
   * @param path - The file path (e.g., 'src/models/User.ts')
   * @param content - The file content
   */
  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  /**
   * No-op for browser - directories are virtual.
   */
  async mkdir(
    _dirPath: string,
    _options?: {recursive?: boolean}
  ): Promise<void> {
    // No-op - directories are virtual in memory
  }

  /**
   * Get all file paths that were written.
   * Implements OutputAdapter interface.
   */
  getWrittenFiles(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * Get all files with their content.
   * Implements OutputAdapter interface.
   */
  getAllFiles(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [path, content] of this.files) {
      result[path] = content;
    }
    return result;
  }

  /**
   * Read a file from memory.
   * @param path - The file path
   * @returns The file content, or undefined if not found
   */
  read(path: string): string | undefined {
    return this.files.get(path);
  }

  /**
   * Get all files as a Record.
   * @deprecated Use getAllFiles() instead for OutputAdapter compatibility
   * @returns A copy of all files as Record<path, content>
   */
  getAll(): Record<string, string> {
    return this.getAllFiles();
  }

  /**
   * Clear all files from memory.
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Check if a file exists.
   * @param path - The file path
   * @returns True if the file exists
   */
  has(path: string): boolean {
    return this.files.has(path);
  }

  /**
   * Delete a specific file.
   * @param path - The file path
   * @returns True if the file was deleted, false if it didn't exist
   */
  delete(path: string): boolean {
    return this.files.delete(path);
  }

  /**
   * Get all file paths.
   * @deprecated Use getWrittenFiles() instead for OutputAdapter compatibility
   * @returns Array of file paths
   */
  getPaths(): string[] {
    return this.getWrittenFiles();
  }

  /**
   * Get the number of files.
   */
  get size(): number {
    return this.files.size;
  }
}
