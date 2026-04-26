/* eslint-disable security/detect-object-injection */
/**
 * MemoryAdapter - Output adapter for browser environments.
 * Stores files in memory instead of writing to disk.
 */
import {OutputAdapter, OutputAdapterOptions} from './types';

/**
 * MemoryAdapter stores files in memory using a Map.
 * Used in browser context for in-memory code generation.
 */
export class MemoryAdapter implements OutputAdapter {
  private files = new Map<string, string>();
  private basePath: string;

  constructor(options?: OutputAdapterOptions) {
    // Normalize basePath - remove trailing slashes
    this.basePath = (options?.basePath ?? '').replace(/\/+$/, '');
  }

  /**
   * Write content to memory.
   */
  async write(filePath: string, content: string): Promise<void> {
    const resolvedPath = this.resolvePath(filePath);
    this.files.set(resolvedPath, content);
  }

  /**
   * No-op for memory adapter - directories are virtual.
   */
  async mkdir(
    _dirPath: string,
    _options?: {recursive?: boolean}
  ): Promise<void> {
    // No-op - directories are virtual in memory
  }

  /**
   * Get all file paths that were written.
   */
  getWrittenFiles(): string[] {
    return [...this.files.keys()];
  }

  /**
   * Get all files with their content.
   */
  getAllFiles(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [filePath, content] of this.files) {
      result[filePath] = content;
    }
    return result;
  }

  /**
   * Read a file from memory.
   * @param filePath - The file path
   * @returns The file content, or undefined if not found
   */
  read(filePath: string): string | undefined {
    return this.files.get(this.resolvePath(filePath));
  }

  /**
   * Clear all files from memory.
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Check if a file exists.
   */
  has(filePath: string): boolean {
    return this.files.has(this.resolvePath(filePath));
  }

  /**
   * Get the number of files.
   */
  get size(): number {
    return this.files.size;
  }

  /**
   * Resolve a file path with the base path.
   */
  private resolvePath(filePath: string): string {
    if (!this.basePath) {
      return filePath;
    }
    // Normalize to avoid double slashes
    return `${this.basePath}/${filePath}`.replace(/\/+/g, '/');
  }
}
