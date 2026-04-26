/**
 * FileSystemAdapter - Output adapter for CLI/Node.js environments.
 * Writes files to the local filesystem.
 */
import {mkdir, writeFile} from 'node:fs/promises';
import {cwd} from 'node:process';
import path from 'node:path';
import {OutputAdapter, OutputAdapterOptions} from './types';

/**
 * FileSystemAdapter writes files to disk using Node.js fs APIs.
 * Used in CLI context for actual file generation.
 */
export class FileSystemAdapter implements OutputAdapter {
  private writtenFiles: string[] = [];
  private basePath: string;

  constructor(options?: OutputAdapterOptions) {
    this.basePath = options?.basePath ?? cwd();
  }

  /**
   * Write content to a file on disk.
   * Creates parent directories if they don't exist.
   */
  async write(filePath: string, content: string): Promise<void> {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.basePath, filePath);

    // Ensure parent directory exists
    const parentDir = path.dirname(resolvedPath);
    await mkdir(parentDir, {recursive: true});

    await writeFile(resolvedPath, content);
    this.writtenFiles.push(resolvedPath);
  }

  /**
   * Create a directory on disk.
   */
  async mkdir(dirPath: string, options?: {recursive?: boolean}): Promise<void> {
    const resolvedPath = path.isAbsolute(dirPath)
      ? dirPath
      : path.resolve(this.basePath, dirPath);
    await mkdir(resolvedPath, options);
  }

  /**
   * Get all file paths that were written.
   */
  getWrittenFiles(): string[] {
    return [...this.writtenFiles];
  }

  /**
   * FileSystemAdapter doesn't keep content in memory.
   * Returns empty object - use getWrittenFiles() for paths.
   */
  getAllFiles(): Record<string, string> {
    return {};
  }
}
