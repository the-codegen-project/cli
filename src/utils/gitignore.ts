import {readFile, appendFile, writeFile, access} from 'node:fs/promises';
import path from 'path';

export interface GitignoreUpdateOptions {
  /**
   * The base directory where .gitignore is located (defaults to process.cwd())
   */
  baseDirectory?: string;
  /**
   * Custom comment header to add before the gitignore entries
   */
  commentHeader?: string;
}

export interface GitignoreUpdateResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  /**
   * The action that was performed
   */
  action: 'created' | 'updated' | 'skipped' | 'error';
  /**
   * A message describing what happened
   */
  message: string;
  /**
   * The paths that were added (if any)
   */
  addedPaths?: string[];
  /**
   * Error details if the operation failed
   */
  error?: string;
}

/**
 * Updates or creates a .gitignore file with the specified output paths
 *
 * @param outputPaths - Array of paths to add to .gitignore
 * @param options - Optional configuration for the gitignore update
 * @returns Result object with operation details
 *
 * @example
 * ```typescript
 * const result = await updateGitignore(['src/__gen__/payloads', 'src/__gen__/channels']);
 * if (result.success) {
 *   console.log(result.message);
 * }
 * ```
 */
export async function updateGitignore(
  outputPaths: string[],
  options: GitignoreUpdateOptions = {}
): Promise<GitignoreUpdateResult> {
  // eslint-disable-next-line no-undef
  const baseDirectory = options.baseDirectory || process.cwd();
  const commentHeader =
    options.commentHeader || '# The Codegen Project - generated files';
  const gitignorePath = path.join(baseDirectory, '.gitignore');

  try {
    // Check if .gitignore exists
    await access(gitignorePath);

    // Read existing content
    const existingContent = await readFile(gitignorePath, 'utf-8');

    // Filter out paths that already exist in .gitignore
    const newPaths = outputPaths.filter(
      (outputPath) => !existingContent.includes(outputPath)
    );

    if (newPaths.length === 0) {
      return {
        success: true,
        action: 'skipped',
        message:
          'All output directories already present in .gitignore, skipping',
        addedPaths: []
      };
    }

    // Ensure file ends with newline before adding new entries
    const separator = existingContent.endsWith('\n') ? '' : '\n';
    const gitignoreEntry = `${separator}\n${commentHeader}\n${newPaths.join('\n')}\n`;

    await appendFile(gitignorePath, gitignoreEntry);

    return {
      success: true,
      action: 'updated',
      message: `Added ${newPaths.length} output director${newPaths.length === 1 ? 'y' : 'ies'} to .gitignore`,
      addedPaths: newPaths
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // .gitignore doesn't exist, try to create it
      try {
        const gitignoreContent = `${commentHeader}\n${outputPaths.join('\n')}\n`;
        await writeFile(gitignorePath, gitignoreContent);

        return {
          success: true,
          action: 'created',
          message: 'Created .gitignore with generated output directories',
          addedPaths: outputPaths
        };
      } catch (writeError: any) {
        // Failed to create .gitignore (e.g., directory doesn't exist)
        return {
          success: false,
          action: 'error',
          message: `Could not create .gitignore: ${writeError.message}`,
          error: writeError.message
        };
      }
    }

    return {
      success: false,
      action: 'error',
      message: `Could not update .gitignore: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Collects output paths from generator flags
 *
 * @param generatorConfigs - Map of generator names to their configurations
 * @returns Array of output paths
 *
 * @example
 * ```typescript
 * const paths = collectOutputPaths({
 *   payloads: { outputPath: 'src/__gen__/payloads' },
 *   channels: { outputPath: 'src/__gen__/channels' }
 * });
 * // Returns: ['src/__gen__/payloads', 'src/__gen__/channels']
 * ```
 */
export function collectOutputPaths(
  generatorConfigs: Record<string, {outputPath: string} | undefined>
): string[] {
  const outputPaths: string[] = [];

  for (const config of Object.values(generatorConfigs)) {
    if (config?.outputPath) {
      outputPaths.push(config.outputPath);
    }
  }

  return outputPaths;
}
