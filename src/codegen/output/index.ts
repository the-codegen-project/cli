/**
 * Output adapter module.
 * Provides abstractions for file output operations that work in both
 * CLI (filesystem) and browser (memory) environments.
 */
import path from 'path';
import {GeneratedFile} from '../types';
import {FileSystemAdapter} from './filesystem';

export * from './types';
export {FileSystemAdapter} from './filesystem';
export {MemoryAdapter} from './memory';
export {generateModels} from './modelina';
export type {GenerateModelsArgs, GenerateModelsResult} from './modelina';

// Re-export GeneratedFile type for convenience
export type {GeneratedFile} from '../types';

/**
 * Write generated files to disk.
 * This is the I/O boundary - called by CLI after pure generation.
 *
 * @param files - The generated files with path and content
 * @param basePath - The base path to resolve relative paths from
 * @returns Array of absolute paths that were written
 */
export async function writeGeneratedFiles(
  files: GeneratedFile[],
  basePath: string
): Promise<string[]> {
  const adapter = new FileSystemAdapter({basePath});
  const writtenPaths: string[] = [];

  for (const file of files) {
    // Ensure directory exists
    const dirPath = path.dirname(file.path);
    if (dirPath && dirPath !== '.') {
      await adapter.mkdir(dirPath, {recursive: true});
    }

    await adapter.write(file.path, file.content);
    writtenPaths.push(path.resolve(basePath, file.path));
  }

  return writtenPaths;
}
