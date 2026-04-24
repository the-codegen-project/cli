/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable security/detect-object-injection */

import {
  ChannelInterface,
  OperationInterface,
  OperationReplyInterface
} from '@asyncapi/parser';
import {platform} from 'process';
import {pascalCase} from './generators/typescript/utils';
import {z} from 'zod';

/**
 * Deep partial type that does NOT partial function arguments.
 */
export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
    ? {[P in keyof T]?: DeepPartial<T[P]>}
    : T;

/**
 * Return true or false based on whether the input object is a regular object or a class
 *
 * Taken from: https://stackoverflow.com/a/43197340/6803886
 * @param obj
 */
function isClass(obj: any): boolean {
  const isCtorClass =
    obj.constructor && obj.constructor.toString().substring(0, 5) === 'class';
  if (obj.prototype === undefined) {
    return isCtorClass;
  }
  const isPrototypeCtorClass =
    obj.prototype.constructor &&
    obj.prototype.constructor.toString &&
    obj.prototype.constructor.toString().substring(0, 5) === 'class';
  return isCtorClass || isPrototypeCtorClass;
}

/**
 * Merge a non optional value with custom optional values to form a full value that has all properties sat.
 */
export function mergePartialAndDefault<T extends Record<string, any>>(
  defaultNonOptional: T,
  customOptional?: DeepPartial<T>
): T {
  if (customOptional === undefined) {
    return Object.assign({}, defaultNonOptional);
  }
  // create a new object
  const target = Object.assign({}, defaultNonOptional) as Record<string, any>;

  // deep merge the object into the target object
  for (const [propName, prop] of Object.entries(customOptional)) {
    const isObjectOrClass =
      typeof prop === 'object' && target[propName] !== undefined;
    const isRegularObject = !isClass(prop);
    const isArray = Array.isArray(prop);
    if (isArray) {
      // merge array into target with a new array instance so we dont touch the default value
      target[propName] = ensureUniqueValuesInArray([
        ...(target[propName] ?? []),
        ...(prop ?? [])
      ]);
    } else if (isObjectOrClass && isRegularObject) {
      target[propName] = mergePartialAndDefault(target[propName], prop);
    } else if (prop) {
      target[propName] = prop;
    }
  }

  return target as T;
}

/**
 * Find duplicates in array of objects based on property
 */
export function findDuplicatesInArray(array: any[], property: string) {
  const foundValues = array.map((generator) => {
    return generator[property];
  });
  const duplicates = foundValues.filter(
    (item, index) => foundValues.indexOf(item) !== index
  );
  return Array.from(new Set(duplicates));
}

/**
 * Get OS type, abstracted away from special cases
 */
export function getOSType(): 'windows' | 'unix' | 'macos' {
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'darwin') {
    return 'macos';
  }
  return 'unix';
}

/**
 * Windows renders relative paths weird i.e. '\' instead of '/'
 */
export function ensureRelativePath(pathToCheck: string) {
  if (getOSType() === 'windows') {
    return pathToCheck.replace(/\\/g, '/');
  }
  return pathToCheck;
}

/**
 * Ensure array has unique values only.
 */
export function ensureUniqueValuesInArray(array: any[]) {
  return array.filter((value, index, filteredArray) => {
    return filteredArray.indexOf(value) === index;
  });
}
export function findExtensionObject(parsedObj: any): any {
  return parsedObj?.extensions()?.get('x-the-codegen-project')?.value();
}

export function findNameFromChannel(channel: ChannelInterface): string {
  const channelId = channel.id();
  const userSpecificName = findExtensionObject(channel)
    ? findExtensionObject(channel)['channelName']
    : undefined;
  if (userSpecificName) {
    return userSpecificName;
  }
  return pascalCase(channelId.replace(/\W/g, ' '));
}
export function findOperationId(
  operation: OperationInterface,
  channel: ChannelInterface
) {
  const userSpecificName = findExtensionObject(operation)
    ? findExtensionObject(operation)['channelName']
    : undefined;
  if (userSpecificName) {
    return userSpecificName;
  }
  let operationId = operation.id();
  operationId = operation.hasOperationId()
    ? operation.operationId()
    : operationId;
  return operationId ?? channel.id();
}
export function findNameFromOperation(
  operation: OperationInterface,
  channel: ChannelInterface
): string {
  const operationId = findOperationId(operation, channel);
  return pascalCase(operationId.replace(/\W/g, ' '));
}

export function firstLowercase(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function findReplyId(
  operation: OperationInterface,
  reply: OperationReplyInterface,
  channel: ChannelInterface
) {
  return `${findOperationId(operation, reply.channel() ?? channel)}_reply`;
}

/**
 * Extract JSDoc metadata from an AsyncAPI operation.
 * Returns description and deprecated flag for use in generated JSDoc comments.
 */
export function getOperationMetadata(operation: OperationInterface): {
  description?: string;
  deprecated?: boolean;
} {
  // Get description - prefer description() over summary()
  let description: string | undefined;
  if (operation.hasDescription()) {
    description = operation.description();
  } else if (operation.hasSummary()) {
    description = operation.summary();
  }

  // Check if operation is deprecated - access from raw JSON since no typed method exists
  // The parser doesn't expose a deprecated() method, but the raw JSON contains it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawJson = (operation as any).json?.() ?? (operation as any)._json;
  const deprecated = rawJson?.deprecated === true;

  return {description, deprecated};
}

export function onlyUnique(array: any[]) {
  const onlyUnique = (value: any, index: number, array: any[]) => {
    return array.indexOf(value) === index;
  };
  return array.filter(onlyUnique);
}

/**
 * Shared Zod schema for import extension configuration.
 * Used both globally (typescript.importExtension) and per-generator.
 *
 * - 'none': No extension (default, for bundlers and classic moduleResolution)
 * - '.ts': Add .ts extension (for moduleResolution: "node16"/"nodenext" with allowImportingTsExtensions)
 * - '.js': Add .js extension (for compiled ESM output)
 */
export const zodImportExtension = z
  .enum(['.ts', '.js', 'none'])
  .optional()
  .describe(
    'File extension for relative imports. ".ts" for node16/nodenext, ".js" for compiled ESM, "none" for bundlers.'
  );

/**
 * Import extension type for TypeScript imports.
 * - 'none': No extension added (default, for bundlers and classic moduleResolution)
 * - '.ts': Add .ts extension (for moduleResolution: "node16" / "nodenext" with allowImportingTsExtensions)
 * - '.js': Add .js extension (for compiled ESM output)
 */
export type ImportExtension = 'none' | '.ts' | '.js';

/**
 * Appends file extension to import path based on configuration.
 * Used to support modern TypeScript moduleResolution settings like "node16" or "nodenext"
 * which require explicit file extensions in import statements.
 *
 * @param importPath - The relative import path (e.g., './payloads/User')
 * @param extension - The extension to append ('none', '.ts', or '.js')
 * @returns The import path with extension appended (or unchanged if 'none')
 *
 * @example
 * appendImportExtension('./payloads/User', '.ts') // => './payloads/User.ts'
 * appendImportExtension('./payloads/User', 'none') // => './payloads/User'
 */
export function appendImportExtension(
  importPath: string,
  extension: ImportExtension
): string {
  if (extension === 'none') {
    return importPath;
  }
  return `${importPath}${extension}`;
}

/**
 * Resolves the effective import extension from generator config or global config.
 * Priority: generator.importExtension > config.importExtension > 'none'
 *
 * @param generator - Generator configuration that may have importExtension override
 * @param config - Global configuration that may have importExtension (optional)
 * @returns The resolved import extension ('none', '.ts', or '.js')
 *
 * @example
 * // Generator override takes precedence
 * resolveImportExtension({importExtension: '.js'}, {importExtension: '.ts'})
 * // => '.js'
 *
 * // Falls back to global config
 * resolveImportExtension({}, {importExtension: '.ts'})
 * // => '.ts'
 *
 * // Defaults to 'none' for backward compatibility
 * resolveImportExtension({}, {})
 * // => 'none'
 */
export function resolveImportExtension(
  generator: {importExtension?: ImportExtension},
  config?: {importExtension?: ImportExtension}
): ImportExtension {
  return generator.importExtension ?? config?.importExtension ?? 'none';
}

/**
 * Portable path join function that works in both Node.js and browser environments.
 * Joins path segments with forward slashes and normalizes the result.
 *
 * @param segments - Path segments to join
 * @returns Joined path with normalized slashes
 *
 * @example
 * joinPath('src/models', 'User.ts') // => 'src/models/User.ts'
 * joinPath('src/models/', '/User.ts') // => 'src/models/User.ts'
 * joinPath('./src', './models', 'User.ts') // => './src/models/User.ts'
 */
export function joinPath(...segments: string[]): string {
  // Filter out empty segments
  const filtered = segments.filter((s) => s !== '');
  if (filtered.length === 0) {
    return '';
  }

  // Join all segments, preserving leading ./ if present
  const preserveLeadingDot = filtered[0].startsWith('./');
  const preserveLeadingSlash = filtered[0].startsWith('/');

  // Join and normalize
  const joined = filtered
    .map((segment, index) => {
      // Remove leading slash from non-first segments
      if (index > 0 && segment.startsWith('/')) {
        segment = segment.slice(1);
      }
      // Remove leading ./ from non-first segments
      if (index > 0 && segment.startsWith('./')) {
        segment = segment.slice(2);
      }
      // Remove trailing slash from all but last segment
      if (index < filtered.length - 1 && segment.endsWith('/')) {
        segment = segment.slice(0, -1);
      }
      return segment;
    })
    .join('/');

  // Normalize multiple slashes
  let result = joined.replace(/\/+/g, '/');

  // Restore leading pattern if needed
  if (preserveLeadingDot && !result.startsWith('./')) {
    result = `./${result}`;
  } else if (preserveLeadingSlash && !result.startsWith('/')) {
    result = `/${result}`;
  }

  return result;
}

/**
 * Checks if a path is absolute (starts with drive letter or /)
 */
function isAbsolutePath(p: string): boolean {
  // Windows drive letter (C:/) or Unix absolute (/)
  return (/^[a-zA-Z]:[\\/]/).test(p) || p.startsWith('/');
}

/**
 * Returns the current working directory in Node environments, or undefined
 * in browser environments where no such concept exists.
 */
function getNodeCwd(): string | undefined {
  // eslint-disable-next-line no-undef
  const g = globalThis as {process?: {cwd?: () => string}};
  const proc = g.process;
  if (proc && typeof proc.cwd === 'function') {
    return proc.cwd().replace(/\\/g, '/');
  }
  return undefined;
}

/**
 * Portable relative path function that works in both Node.js and browser environments.
 * Computes the relative path from one location to another.
 *
 * @param from - The starting directory path
 * @param to - The target path
 * @returns Relative path from 'from' to 'to'
 *
 * @example
 * relativePath('src/channels', 'src/models/User') // => '../models/User'
 * relativePath('src/a/b', 'src/a/c') // => '../c'
 * relativePath('src/models', 'src/models/User') // => 'User'
 */
export function relativePath(from: string, to: string): string {
  // Normalize Windows backslashes to forward slashes first
  const normalizedFrom = from.replace(/\\/g, '/');
  const normalizedTo = to.replace(/\\/g, '/');

  const fromIsAbsolute = isAbsolutePath(normalizedFrom);
  const toIsAbsolute = isAbsolutePath(normalizedTo);

  // Handle mixed absolute/relative paths by resolving the relative one
  // against the current working directory (Node). This mirrors
  // `path.relative`, giving a deterministic result that doesn't depend on
  // the depth of the absolute path from the filesystem root.
  const cwd = getNodeCwd();
  if (fromIsAbsolute !== toIsAbsolute && cwd !== undefined) {
    const resolvedFrom = fromIsAbsolute
      ? normalizedFrom
      : joinPath(cwd, normalizedFrom);
    const resolvedTo = toIsAbsolute
      ? normalizedTo
      : joinPath(cwd, normalizedTo);
    return relativePath(resolvedFrom, resolvedTo);
  }

  // Fallback for browser: strip any absolute prefix so the two paths can be
  // compared as relative paths (CWD-dependent, but browsers shouldn't see
  // real absolute filesystem paths).
  if (fromIsAbsolute && !toIsAbsolute) {
    const fromWithoutRoot = normalizedFrom
      .replace(/^[a-zA-Z]:\//, '')
      .replace(/^\//, '');
    return relativePath(fromWithoutRoot, normalizedTo);
  }

  if (!fromIsAbsolute && toIsAbsolute) {
    const toWithoutRoot = normalizedTo
      .replace(/^[a-zA-Z]:\//, '')
      .replace(/^\//, '');
    return relativePath(normalizedFrom, toWithoutRoot);
  }

  // Normalize paths: remove leading ./ and trailing /
  const normFrom = normalizedFrom.replace(/^\.\//, '').replace(/\/$/, '');
  const normTo = normalizedTo.replace(/^\.\//, '').replace(/\/$/, '');

  const fromParts = normFrom.split('/').filter((p) => p !== '');
  const toParts = normTo.split('/').filter((p) => p !== '');

  // Find common prefix length
  let commonLength = 0;
  const minLength = Math.min(fromParts.length, toParts.length);
  for (let i = 0; i < minLength; i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // Number of directories to go up from 'from'
  const upCount = fromParts.length - commonLength;

  // Remaining path in 'to' after common prefix
  const remainingTo = toParts.slice(commonLength);

  // Build relative path
  const upParts = Array(upCount).fill('..');
  const relativeParts = [...upParts, ...remainingTo];

  if (relativeParts.length === 0) {
    return '.';
  }

  return relativeParts.join('/');
}
