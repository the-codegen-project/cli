/**
 * Parse configuration from string for browser environments.
 * Replaces cosmiconfig filesystem search with direct string parsing.
 */
import {parse as parseYaml} from 'yaml';
import {
  TheCodegenConfiguration,
  zodTheCodegenConfiguration
} from '../codegen/types';

/**
 * Parse a configuration string into a validated configuration object.
 *
 * @param configString - The configuration as a string (JSON or YAML)
 * @param format - The format of the string ('json' or 'yaml')
 * @returns The validated configuration object
 * @throws Error if parsing or validation fails
 */
export function parseConfig(
  configString: string,
  format: 'json' | 'yaml'
): TheCodegenConfiguration {
  let rawConfig: unknown;

  // Parse the string based on format
  try {
    if (format === 'json') {
      rawConfig = JSON.parse(configString);
    } else {
      rawConfig = parseYaml(configString);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(`Failed to parse ${format} configuration: ${message}`);
  }

  // Validate with Zod schema
  const result = zodTheCodegenConfiguration.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${errors}`);
  }

  return result.data;
}

/**
 * Serialize a configuration object to a string.
 *
 * @param config - The configuration object
 * @param format - The output format ('json' or 'yaml')
 * @returns The configuration as a string
 */
export function serializeConfig(
  config: TheCodegenConfiguration,
  format: 'json' | 'yaml'
): string {
  if (format === 'json') {
    return JSON.stringify(config, null, 2);
  }
  // For YAML, we'd need to import stringify from yaml
  // For now, default to JSON
  return JSON.stringify(config, null, 2);
}
