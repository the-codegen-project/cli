import * as path from 'path';
import * as fs from 'fs';

// Select a specific file to test. Empty string runs the full matrix; CI shards
// by setting BLACKBOX_FILE / BLACKBOX_CONFIG per job.
// eslint-disable-next-line no-undef
const TEST_SPECIFIC_FILE: string = process.env.BLACKBOX_FILE ?? '';
// Select a specific config to test (substring match).
// eslint-disable-next-line no-undef
const TEST_SPECIFIC_CONFIG: string = process.env.BLACKBOX_CONFIG ?? '';

/**
 * Config×file pairs that are known to fail and are tracked as debt rather than
 * silently skipped. Each entry is `<config-substring>::<file-substring>` with a
 * one-line justification. Keep this empty unless a failure is documented here.
 */
export const KNOWN_FAILING: {pair: string; reason: string}[] = [];

/**
 * Whether a given config/file pair is on the tracked KNOWN_FAILING list.
 */
export function isKnownFailing(configFile: string, schemaFile: string): boolean {
  return KNOWN_FAILING.some(({pair}) => {
    const [configPart, filePart] = pair.split('::');
    return configFile.includes(configPart) && schemaFile.includes(filePart);
  });
}

/**
 * Read all the files in the folder, and return the appropriate Jest `each`
 * entries, each tagged with the given input type.
 */
function readFilesInFolder(folder: string, inputType: string) {
  // eslint-disable-next-line no-undef
  const fullPath = path.resolve(__dirname, folder);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readdirSync(fullPath).map((file) => {
    return {
      file: `${folder}/${file}`,
      inputType
    };
  });
}

/**
 * Read the `inputType` declared by a config file so the matrix only pairs a
 * config with schema files of the matching input type (an AsyncAPI config
 * cannot load a JSON Schema document, and vice versa).
 */
function readConfigInputType(configPath: string): string {
  // eslint-disable-next-line no-undef, security/detect-non-literal-fs-filename
  const content = fs.readFileSync(path.resolve(__dirname, configPath), 'utf8');
  const match = content.match(/inputType:\s*['"]([a-z]+)['"]/);
  return match?.[1] ?? '';
}

export const filesToTest = [
  ...readFilesInFolder('./schemas/asyncapi', 'asyncapi'),
  ...readFilesInFolder('./schemas/jsonschema', 'jsonschema')
].filter((value) => {
  if (TEST_SPECIFIC_FILE !== '') return value.file.includes(TEST_SPECIFIC_FILE);
  return true;
});

export const typescriptConfig = readFilesInFolder(
  './configs/typescript',
  ''
)
  .map((value) => ({
    ...value,
    inputType: readConfigInputType(value.file)
  }))
  .filter((value) => {
    if (TEST_SPECIFIC_CONFIG === '') return true;
    // Support a comma-separated list of config substrings so CI can shard the
    // matrix into buckets (e.g. BLACKBOX_CONFIG="channels,client").
    return TEST_SPECIFIC_CONFIG.split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .some((part) => value.file.includes(part));
  });
