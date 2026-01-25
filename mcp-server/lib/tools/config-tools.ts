/**
 * MCP Tools for configuration management.
 * These tools help users create and manage codegen configuration files.
 */

import { z } from 'zod';
import {
  type InputType,
  type GeneratorPreset,
  generators,
  getGeneratorsForInput,
  getGenerator,
  inputTypeGenerators,
  protocolDescriptions,
} from '../data/generators';

/**
 * Schema for create_config tool
 */
export const createConfigSchema = z.object({
  inputType: z.enum(['asyncapi', 'openapi', 'jsonschema']).describe(
    'The type of input specification'
  ),
  inputPath: z.string().describe('Path to the input specification file'),
  generators: z
    .array(z.enum(['payloads', 'parameters', 'headers', 'types', 'channels', 'client', 'models', 'custom']))
    .describe('Generator presets to include'),
  configFormat: z
    .enum(['mjs', 'ts', 'json', 'yaml'])
    .optional()
    .default('mjs')
    .describe('Output format for the configuration file'),
  protocols: z
    .array(z.enum(['nats', 'kafka', 'mqtt', 'amqp', 'websocket', 'http_client', 'event_source']))
    .optional()
    .describe('Protocols to generate for channels/client generators'),
});

export type CreateConfigInput = z.infer<typeof createConfigSchema>;

/**
 * Create a codegen configuration file
 */
export function createConfig(input: CreateConfigInput): {
  content: string;
  filename: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const availableGenerators = inputTypeGenerators[input.inputType];

  // Validate generators are compatible with input type
  const validGenerators = input.generators.filter((g) => {
    if (!availableGenerators.includes(g)) {
      warnings.push(
        `Generator "${g}" is not available for input type "${input.inputType}". Skipping.`
      );
      return false;
    }
    return true;
  });

  // Build generator configurations
  const generatorConfigs = validGenerators.map((preset) => {
    const genDef = getGenerator(preset);
    const config: Record<string, unknown> = {
      preset,
      outputPath: genDef?.defaultOutputPath || `src/__gen__/${preset}`,
    };

    // Add protocols if needed
    if ((preset === 'channels' || preset === 'client') && input.protocols?.length) {
      const validProtocols =
        preset === 'client'
          ? input.protocols.filter((p) => p === 'nats')
          : input.protocols;
      if (validProtocols.length > 0) {
        config.protocols = validProtocols;
      }
      if (preset === 'client' && input.protocols.some((p) => p !== 'nats')) {
        warnings.push('Client generator currently only supports NATS protocol.');
      }
    }

    return config;
  });

  // Generate the configuration content
  let content: string;
  let filename: string;

  switch (input.configFormat) {
    case 'json':
      content = JSON.stringify(
        {
          inputType: input.inputType,
          inputPath: input.inputPath,
          language: 'typescript',
          generators: generatorConfigs,
        },
        null,
        2
      );
      filename = 'codegen.json';
      break;

    case 'yaml':
      content = generateYamlConfig(input.inputType, input.inputPath, generatorConfigs);
      filename = 'codegen.yaml';
      break;

    case 'ts':
      content = generateTsConfig(input.inputType, input.inputPath, generatorConfigs);
      filename = 'codegen.config.ts';
      break;

    case 'mjs':
    default:
      content = generateMjsConfig(input.inputType, input.inputPath, generatorConfigs);
      filename = 'codegen.config.mjs';
      break;
  }

  return { content, filename, warnings };
}

function generateMjsConfig(
  inputType: string,
  inputPath: string,
  generators: Record<string, unknown>[]
): string {
  const generatorsStr = generators
    .map((g) => {
      const entries = Object.entries(g)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `      ${key}: '${value}'`;
          }
          return `      ${key}: ${JSON.stringify(value)}`;
        })
        .join(',\n');
      return `    {\n${entries}\n    }`;
    })
    .join(',\n');

  return `/**
 * The Codegen Project configuration file.
 * @see https://github.com/the-codegen-project/cli
 */
export default {
  inputType: '${inputType}',
  inputPath: '${inputPath}',
  language: 'typescript',
  generators: [
${generatorsStr}
  ]
};
`;
}

function generateYamlConfig(
  inputType: string,
  inputPath: string,
  generators: Record<string, unknown>[]
): string {
  const generatorsYaml = generators
    .map((g) => {
      const lines = Object.entries(g)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `    ${key}:\n${value.map((v) => `      - ${v}`).join('\n')}`;
          }
          return `    ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
        })
        .join('\n');
      return `  - ${lines.replace(/^ {4}/, '')}`;
    })
    .join('\n');

  return `# The Codegen Project configuration file
# https://github.com/the-codegen-project/cli

inputType: ${inputType}
inputPath: ${inputPath}
language: typescript
generators:
${generatorsYaml}
`;
}

function generateTsConfig(
  inputType: string,
  inputPath: string,
  generators: Record<string, unknown>[]
): string {
  const configuration = {
    inputType,
    inputPath,
    language: 'typescript',
    generators,
  };
  const stringifiedConfiguration = JSON.stringify(configuration, null, 2);
  // Remove quotes from property keys to match CLI output
  const unquotedConfiguration = stringifiedConfiguration.replace(
    /"([^"]+)":/g,
    '$1:'
  );

  return `import { TheCodegenConfiguration } from '@the-codegen-project/cli';
const config: TheCodegenConfiguration = ${unquotedConfiguration};
export default config;`;
}

/**
 * Schema for add_generator tool
 */
export const addGeneratorSchema = z.object({
  preset: z
    .enum(['payloads', 'parameters', 'headers', 'types', 'channels', 'client', 'models', 'custom'])
    .describe('Generator preset to add'),
  outputPath: z.string().optional().describe('Output path for generated code'),
  protocols: z
    .array(z.enum(['nats', 'kafka', 'mqtt', 'amqp', 'websocket', 'http_client', 'event_source']))
    .optional()
    .describe('Protocols for channels/client generators'),
  serializationType: z.enum(['json']).optional().describe('Serialization format'),
  includeValidation: z.boolean().optional().describe('Include AJV validation'),
});

export type AddGeneratorInput = z.infer<typeof addGeneratorSchema>;

/**
 * Generate a configuration object for a single generator
 */
export function addGenerator(input: AddGeneratorInput): {
  config: Record<string, unknown>;
  notes: string[];
} {
  const notes: string[] = [];
  const genDef = getGenerator(input.preset);

  const config: Record<string, unknown> = {
    preset: input.preset,
    outputPath: input.outputPath || genDef?.defaultOutputPath || `src/__gen__/${input.preset}`,
  };

  // Add protocols if applicable
  if ((input.preset === 'channels' || input.preset === 'client') && input.protocols) {
    if (input.preset === 'client') {
      config.protocols = input.protocols.filter((p) => p === 'nats');
      if (input.protocols.some((p) => p !== 'nats')) {
        notes.push('Client generator currently only supports NATS. Other protocols were filtered out.');
      }
    } else {
      config.protocols = input.protocols;
    }
  }

  // Add serialization type if applicable
  if (input.serializationType && ['payloads', 'parameters', 'headers'].includes(input.preset)) {
    config.serializationType = input.serializationType;
  }

  // Add validation flag if applicable
  if (input.includeValidation !== undefined && ['payloads', 'headers'].includes(input.preset)) {
    config.includeValidation = input.includeValidation;
  }

  // Add notes about dependencies
  if (genDef?.dependencies?.length) {
    notes.push(
      `This generator depends on: ${genDef.dependencies.join(', ')}. Make sure those are included in your config.`
    );
  }

  return { config, notes };
}

/**
 * Schema for list_generators tool
 */
export const listGeneratorsSchema = z.object({
  inputType: z
    .enum(['asyncapi', 'openapi', 'jsonschema'])
    .optional()
    .describe('Filter generators by input type'),
});

export type ListGeneratorsInput = z.infer<typeof listGeneratorsSchema>;

/**
 * List available generators
 */
export function listGenerators(input: ListGeneratorsInput): {
  generators: Array<{
    preset: string;
    description: string;
    supportedInputs: string[];
    defaultOutputPath: string;
    options: Array<{
      name: string;
      type: string;
      description: string;
      default?: unknown;
      required?: boolean;
    }>;
    dependencies?: string[];
  }>;
  protocols: Array<{
    name: string;
    description: string;
  }>;
} {
  const genList = input.inputType
    ? getGeneratorsForInput(input.inputType)
    : Object.values(generators);

  return {
    generators: genList.map((g) => ({
      preset: g.preset,
      description: g.description,
      supportedInputs: g.supportedInputs,
      defaultOutputPath: g.defaultOutputPath,
      options: g.options.map((o) => ({
        name: o.name,
        type: o.type,
        description: o.description,
        default: o.default,
        required: o.required,
      })),
      dependencies: g.dependencies,
    })),
    protocols: Object.entries(protocolDescriptions).map(([name, description]) => ({
      name,
      description,
    })),
  };
}

/**
 * Schema for validate_config tool
 */
export const validateConfigSchema = z.object({
  config: z.record(z.unknown()).describe('Configuration object to validate'),
});

export type ValidateConfigInput = z.infer<typeof validateConfigSchema>;

/**
 * Validate a configuration object
 */
export function validateConfig(input: ValidateConfigInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = input.config;

  // Check required fields
  if (!config.inputType) {
    errors.push('Missing required field: inputType');
  } else if (!['asyncapi', 'openapi', 'jsonschema'].includes(config.inputType as string)) {
    errors.push(`Invalid inputType: "${config.inputType}". Must be one of: asyncapi, openapi, jsonschema`);
  }

  if (!config.inputPath) {
    errors.push('Missing required field: inputPath');
  } else if (typeof config.inputPath !== 'string') {
    errors.push('inputPath must be a string');
  }

  if (!config.generators) {
    errors.push('Missing required field: generators');
  } else if (!Array.isArray(config.generators)) {
    errors.push('generators must be an array');
  } else {
    const inputType = config.inputType as InputType;
    const availablePresets = inputType ? inputTypeGenerators[inputType] : [];

    (config.generators as Array<Record<string, unknown>>).forEach((gen, i) => {
      if (!gen.preset) {
        errors.push(`Generator at index ${i}: missing required field "preset"`);
      } else {
        const preset = gen.preset as GeneratorPreset;

        // Check if preset is valid
        if (!generators[preset]) {
          errors.push(`Generator at index ${i}: unknown preset "${preset}"`);
        } else if (inputType && !availablePresets.includes(preset)) {
          errors.push(
            `Generator at index ${i}: preset "${preset}" is not available for input type "${inputType}"`
          );
        }

        // Check protocols for channels/client
        if ((preset === 'channels' || preset === 'client') && !gen.protocols) {
          warnings.push(
            `Generator at index ${i} (${preset}): no protocols specified. Consider adding protocols.`
          );
        }
      }
    });
  }

  // Optional field validation
  if (config.language && config.language !== 'typescript') {
    warnings.push('Currently only TypeScript is supported. Language will default to typescript.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Export all tools for registration
 */
export const configTools = {
  createConfig: {
    schema: createConfigSchema,
    handler: createConfig,
  },
  addGenerator: {
    schema: addGeneratorSchema,
    handler: addGenerator,
  },
  listGenerators: {
    schema: listGeneratorsSchema,
    handler: listGenerators,
  },
  validateConfig: {
    schema: validateConfigSchema,
    handler: validateConfig,
  },
};
