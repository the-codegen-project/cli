/**
 * Automatic project setup detection for TypeScript projects.
 * Analyzes tsconfig.json and package.json to determine optimal defaults.
 */

import fs from 'fs/promises';
import path from 'path';
import {Logger} from '../LoggingInterface';
import type {ImportExtension} from './utils';

interface TsConfig {
  extends?: string;
  compilerOptions?: {
    moduleResolution?: string;
    allowImportingTsExtensions?: boolean;
    module?: string;
  };
}

interface PackageJson {
  type?: 'module' | 'commonjs';
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

const BUNDLERS = [
  'vite',
  'webpack',
  'esbuild',
  'rollup',
  'parcel',
  'turbopack'
];

/**
 * Detect the appropriate import extension based on project configuration.
 *
 * @param configFilePath - Path to the codegen config file (used as search root)
 * @returns Detected ImportExtension or undefined if detection fails
 */
export async function detectImportExtension(
  configFilePath: string
): Promise<ImportExtension | undefined> {
  const configDir = path.dirname(configFilePath);

  Logger.verbose(`Detecting import extension from project configuration...`);
  Logger.debug(`Search root: ${configDir}`);

  // Try to find and parse tsconfig.json and package.json
  const tsconfig = await findAndParseTsConfig(configDir);
  const packageJson = await findAndParsePackageJson(configDir);

  // Detection logic
  const detected = determineImportExtension(tsconfig, packageJson);

  if (detected) {
    Logger.verbose(`Auto-detected importExtension: "${detected}"`);
  } else {
    Logger.debug(`Could not auto-detect importExtension, will use default`);
  }

  return detected;
}

async function findAndParseTsConfig(
  startDir: string
): Promise<TsConfig | undefined> {
  // Search up directory tree for tsconfig.json
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const tsconfigPath = path.join(currentDir, 'tsconfig.json');
    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8');
      Logger.debug(`Found tsconfig.json at: ${tsconfigPath}`);

      // Parse JSON (handle comments by stripping them)
      const cleanJson = stripJsonComments(content);
      const tsconfig: TsConfig = JSON.parse(cleanJson);

      // Resolve extends if present
      if (tsconfig.extends) {
        return await resolveTsConfigExtends(tsconfig, currentDir);
      }

      return tsconfig;
    } catch (error: unknown) {
      // File not found or parse error, continue searching
      const errCode = (error as {code?: string}).code;
      if (errCode !== 'ENOENT') {
        Logger.debug(`Error parsing tsconfig at ${tsconfigPath}: ${error}`);
      }
    }
    currentDir = path.dirname(currentDir);
  }

  Logger.debug('No tsconfig.json found in directory tree');
  return undefined;
}

async function findAndParsePackageJson(
  startDir: string
): Promise<PackageJson | undefined> {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const packagePath = path.join(currentDir, 'package.json');
    try {
      const content = await fs.readFile(packagePath, 'utf-8');
      Logger.debug(`Found package.json at: ${packagePath}`);
      return JSON.parse(content);
    } catch {
      // Continue searching
    }
    currentDir = path.dirname(currentDir);
  }

  Logger.debug('No package.json found in directory tree');
  return undefined;
}

function determineImportExtension(
  tsconfig: TsConfig | undefined,
  packageJson: PackageJson | undefined
): ImportExtension | undefined {
  // Check for bundler in package.json first
  if (packageJson && hasBundler(packageJson)) {
    Logger.debug('Detected bundler in package.json, recommending "none"');
    return 'none';
  }

  // Check tsconfig.json moduleResolution
  if (tsconfig?.compilerOptions) {
    const {moduleResolution, allowImportingTsExtensions} =
      tsconfig.compilerOptions;
    const normalizedResolution = moduleResolution?.toLowerCase();

    // Bundler mode
    if (normalizedResolution === 'bundler') {
      Logger.debug('moduleResolution is "bundler", recommending "none"');
      return 'none';
    }

    // Node16/NodeNext modes
    if (
      normalizedResolution === 'node16' ||
      normalizedResolution === 'nodenext'
    ) {
      if (allowImportingTsExtensions) {
        Logger.debug(
          `moduleResolution is "${moduleResolution}" with allowImportingTsExtensions, recommending ".ts"`
        );
        return '.ts';
      }
      Logger.debug(
        `moduleResolution is "${moduleResolution}" without allowImportingTsExtensions, recommending ".js"`
      );
      return '.js';
    }

    // Classic Node resolution (node, node10, classic)
    if (
      normalizedResolution === 'node' ||
      normalizedResolution === 'node10' ||
      normalizedResolution === 'classic'
    ) {
      Logger.debug(
        `moduleResolution is "${moduleResolution}", recommending "none"`
      );
      return 'none';
    }
  }

  // Could not determine - return undefined to use default
  return undefined;
}

function hasBundler(packageJson: PackageJson): boolean {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  for (const bundler of BUNDLERS) {
    // eslint-disable-next-line security/detect-object-injection
    if (allDeps[bundler]) {
      Logger.debug(`Found bundler "${bundler}" in dependencies`);
      return true;
    }
  }

  return false;
}

async function resolveTsConfigExtends(
  tsconfig: TsConfig,
  baseDir: string
): Promise<TsConfig> {
  if (!tsconfig.extends) {
    return tsconfig;
  }

  try {
    let extendsPath = tsconfig.extends;

    // Handle relative paths
    if (extendsPath.startsWith('.')) {
      extendsPath = path.resolve(baseDir, extendsPath);
    } else {
      // It's a package reference, try to resolve it
      // For now, just return the base config without extending
      Logger.debug(
        `tsconfig extends package "${extendsPath}", using local config only`
      );
      return tsconfig;
    }

    // Ensure .json extension
    if (!extendsPath.endsWith('.json')) {
      extendsPath += '.json';
    }

    const content = await fs.readFile(extendsPath, 'utf-8');
    const parentConfig: TsConfig = JSON.parse(stripJsonComments(content));

    // Recursively resolve parent's extends
    const resolvedParent = await resolveTsConfigExtends(
      parentConfig,
      path.dirname(extendsPath)
    );

    // Merge: child overrides parent
    return {
      ...resolvedParent,
      ...tsconfig,
      compilerOptions: {
        ...resolvedParent.compilerOptions,
        ...tsconfig.compilerOptions
      }
    };
  } catch (error) {
    Logger.debug(`Could not resolve tsconfig extends: ${error}`);
    return tsconfig;
  }
}

function stripJsonComments(json: string): string {
  // Simple comment stripper for tsconfig.json
  // Handles // and /* */ style comments
  return json
    .replace(/\/\/.*$/gm, '') // Single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
}
