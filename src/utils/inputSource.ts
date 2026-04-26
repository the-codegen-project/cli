/**
 * Helpers for classifying an input path as a remote URL or a local
 * filesystem path. Used at the configuration layer to decide whether to
 * pass the path through `path.resolve` (local) or untouched (remote).
 */
import path from 'path';

export type InputSourceType =
  | 'remote_url'
  | 'local_relative'
  | 'local_absolute';

export function isRemoteUrl(inputPath: string): boolean {
  return inputPath.startsWith('http://') || inputPath.startsWith('https://');
}

export function getInputSourceType(inputPath: string): InputSourceType {
  if (isRemoteUrl(inputPath)) {
    return 'remote_url';
  }
  if (path.isAbsolute(inputPath)) {
    return 'local_absolute';
  }
  return 'local_relative';
}
