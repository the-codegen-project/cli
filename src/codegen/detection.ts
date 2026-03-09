/**
 * Project settings detection for automatic configuration.
 * Detects TypeScript module resolution settings and bundler presence
 * to set intelligent defaults for importExtension.
 */
import {existsSync, readFileSync} from 'fs';
import path from 'path';
import {Logger} from '../LoggingInterface';
import type {ImportExtension} from './utils';

interface TsConfig {
  compilerOptions?: {
    moduleResolution?: string;
    module?: string;
    allowImportingTsExtensions?: boolean;
    verbatimModuleSyntax?: boolean;
  };
}

interface PackageJson {
  type?: 'module' | 'commonjs';
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** Bundler packages that indicate no extension is needed */
const BUNDLER_DEPS = new Set([
  'webpack',
  'vite',
  'esbuild',
  'rollup',
  'parcel',
  'turbopack',
  '@rspack/core'
]);

/** Bundler config files that indicate no extension is needed */
const BUNDLER_CONFIGS = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'webpack.config.js',
  'webpack.config.ts',
  'webpack.config.mjs',
  'rollup.config.js',
  'rollup.config.ts',
  'rollup.config.mjs',
  'next.config.js',
  'next.config.ts',
  'next.config.mjs',
  'esbuild.config.js',
  'esbuild.config.mjs',
  'rspack.config.js',
  'rspack.config.ts',
  'rspack.config.mjs'
];

/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 * Used for tsconfig.json which officially supports JSONC format.
 *
 * This implementation uses a character-by-character state machine to properly
 * handle comments while respecting string boundaries (i.e., doesn't strip '//'
 * from inside string values like URLs or paths).
 */
function parseJsonc(content: string): unknown {
  let result = '';
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    // Handle string literals (respect escape sequences)
    if (char === '"') {
      result += char;
      i++;

      // Copy string content until closing quote, handling escapes
      while (i < content.length) {
        const strChar = content[i];
        result += strChar;

        if (strChar === '\\') {
          // Escape sequence - copy next character blindly
          i++;
          if (i < content.length) {
            result += content[i];
            i++;
          }
        } else if (strChar === '"') {
          // End of string
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // Handle single-line comments (//)
    if (char === '/' && i + 1 < content.length && content[i + 1] === '/') {
      // Skip until end of line
      i += 2;
      while (i < content.length && content[i] !== '\n' && content[i] !== '\r') {
        i++;
      }
      continue;
    }

    // Handle multi-line comments (/* */)
    if (char === '/' && i + 1 < content.length && content[i + 1] === '*') {
      // Skip until closing */
      i += 2;
      while (i < content.length - 1) {
        if (content[i] === '*' && content[i + 1] === '/') {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    // Regular character - copy it
    result += char;
    i++;
  }

  // Strip trailing commas before closing brackets/braces
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(result);
}

/**
 * Safely read and parse JSON file, returning null on any error.
 * For tsconfig.json, uses JSONC parsing to handle comments and trailing commas.
 */
function readJsonFile<T>(filePath: string, allowJsonc = false): T | null {
  try {
    const content = readFileSync(filePath, 'utf8');
    if (allowJsonc) {
      return parseJsonc(content) as T;
    }
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Check for bundler config files in the project directory.
 */
function detectBundlerConfigFile(projectDir: string): string | null {
  for (const configFile of BUNDLER_CONFIGS) {
    const configPath = path.join(projectDir, configFile);
    if (existsSync(configPath)) {
      return configFile;
    }
  }
  return null;
}

/**
 * Check for bundler dependencies in package.json.
 */
function detectBundlerDependency(packageJson: PackageJson): string | null {
  const allDeps = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  });

  for (const dep of allDeps) {
    if (BUNDLER_DEPS.has(dep)) {
      return dep;
    }
  }
  return null;
}

/**
 * Determine import extension from tsconfig moduleResolution setting.
 */
function detectFromModuleResolution(
  moduleRes: string | undefined,
  allowTsExtensions: boolean | undefined
): ImportExtension | null {
  const resolution = moduleRes?.toLowerCase();

  if (resolution === 'bundler') {
    Logger.verbose(
      `Auto-detected moduleResolution: bundler → importExtension: 'none'`
    );
    return 'none';
  }

  if (resolution === 'node16' || resolution === 'nodenext') {
    if (allowTsExtensions) {
      Logger.verbose(
        `Auto-detected moduleResolution: ${resolution} with allowImportingTsExtensions → importExtension: '.ts'`
      );
      return '.ts';
    }
    Logger.verbose(
      `Auto-detected moduleResolution: ${resolution} → importExtension: '.js'`
    );
    return '.js';
  }

  return null;
}

/**
 * Detects appropriate import extension based on project configuration.
 *
 * Detection priority:
 * 1. Bundler config files present → 'none'
 * 2. Bundler in dependencies → 'none'
 * 3. moduleResolution: 'bundler' → 'none'
 * 4. moduleResolution: 'node16'/'nodenext' + allowImportingTsExtensions → '.ts'
 * 5. moduleResolution: 'node16'/'nodenext' → '.js'
 * 6. Otherwise → null (use default)
 *
 * @param projectDir - Directory to analyze (where package.json/tsconfig.json are)
 * @returns Detected import extension or null if no detection could be made
 */
export async function detectTypeScriptImportExtension(
  projectDir: string
): Promise<ImportExtension | null> {
  try {
    // Step 1: Check for bundler config files
    const bundlerConfig = detectBundlerConfigFile(projectDir);
    if (bundlerConfig) {
      Logger.verbose(
        `Auto-detected bundler config: ${bundlerConfig} → importExtension: 'none'`
      );
      return 'none';
    }

    // Step 2: Check package.json for bundler dependencies
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJson = readJsonFile<PackageJson>(packageJsonPath);

    if (packageJson) {
      const bundlerDep = detectBundlerDependency(packageJson);
      if (bundlerDep) {
        Logger.verbose(
          `Auto-detected bundler dependency: ${bundlerDep} → importExtension: 'none'`
        );
        return 'none';
      }
    }

    // Step 3: Read tsconfig.json for moduleResolution (use JSONC parser)
    const tsconfigPath = path.join(projectDir, 'tsconfig.json');
    const tsconfig = readJsonFile<TsConfig>(tsconfigPath, true);

    if (!tsconfig) {
      Logger.verbose(
        'Could not read tsconfig.json, skipping import extension detection'
      );
      return null;
    }

    const options = tsconfig.compilerOptions;
    if (!options) {
      Logger.verbose('No compilerOptions in tsconfig.json');
      return null;
    }

    // Step 4: Check moduleResolution
    return detectFromModuleResolution(
      options.moduleResolution,
      options.allowImportingTsExtensions
    );
  } catch (error) {
    Logger.verbose(`Project detection failed: ${error}`);
    return null;
  }
}
