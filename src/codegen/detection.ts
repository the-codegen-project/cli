/**
 * Project settings detection for automatic configuration.
 * Detects TypeScript module resolution settings and bundler presence
 * to set intelligent defaults for importExtension.
 */
import {existsSync, readFileSync} from 'fs';
import path from 'path';
import {parse as parseJsonc} from 'comment-json';
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
  'next',
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
 * Safely read and parse JSON file, returning null on any error.
 * For tsconfig.json, uses JSONC parsing (via comment-json) to handle comments and trailing commas.
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
 * If moduleResolution is undefined, infers it from the module setting per TypeScript rules.
 */
function detectFromModuleResolution(
  moduleRes: string | undefined,
  module: string | undefined,
  allowTsExtensions: boolean | undefined
): ImportExtension | null {
  // Infer moduleResolution from module if not explicitly set
  // TypeScript infers: "Node16" → "node16", "NodeNext" → "nodenext"
  let resolution = moduleRes?.toLowerCase();

  if (!resolution && module) {
    const moduleLower = module.toLowerCase();
    if (moduleLower === 'node16' || moduleLower === 'nodenext') {
      resolution = moduleLower;
      Logger.verbose(
        `Inferred moduleResolution: ${resolution} from module: ${module}`
      );
    }
  }

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
 * 4. moduleResolution: 'node16'/'nodenext' (or inferred from module) + allowImportingTsExtensions → '.ts'
 * 5. moduleResolution: 'node16'/'nodenext' (or inferred from module) → '.js'
 * 6. Otherwise → null (use default)
 *
 * Note: If moduleResolution is not set but module is 'Node16' or 'NodeNext',
 * moduleResolution is inferred per TypeScript's behavior.
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

    // Step 4: Check moduleResolution (with inference from module if needed)
    return detectFromModuleResolution(
      options.moduleResolution,
      options.module,
      options.allowImportingTsExtensions
    );
  } catch (error) {
    Logger.verbose(`Project detection failed: ${error}`);
    return null;
  }
}
