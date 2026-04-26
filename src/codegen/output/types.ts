/**
 * Output adapter types for abstracting file output operations.
 * Allows generators to work in both CLI (filesystem) and browser (memory) environments.
 */

/**
 * Abstract interface for file output operations.
 * Allows generators to work in both CLI (filesystem) and browser (memory) environments.
 */
export interface OutputAdapter {
  /**
   * Write content to a file path.
   * @param filePath - The file path to write to (relative or absolute)
   * @param content - The content to write
   */
  write(filePath: string, content: string): Promise<void>;

  /**
   * Create a directory.
   * @param dirPath - The directory path to create
   * @param options - Options (e.g., recursive)
   */
  mkdir(dirPath: string, options?: {recursive?: boolean}): Promise<void>;

  /**
   * Get all written files (for tracking/reporting).
   * @returns Array of file paths that were written
   */
  getWrittenFiles(): string[];

  /**
   * Get all files with their content.
   * For FileSystemAdapter, this returns an empty object (use getWrittenFiles() for paths).
   * For MemoryAdapter, this returns all files with their content.
   * @returns Record of path to content
   */
  getAllFiles(): Record<string, string>;
}

/**
 * Options for OutputAdapter implementations.
 */
export interface OutputAdapterOptions {
  /**
   * Base path for resolving relative paths.
   * For FileSystemAdapter: directory on disk
   * For MemoryAdapter: prefix for virtual paths
   */
  basePath?: string;
}
