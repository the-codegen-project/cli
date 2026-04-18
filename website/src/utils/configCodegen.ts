/**
 * Generate TypeScript config code from form state.
 * Used to sync form changes → TypeScript editor.
 */

export interface GeneratorFormState {
  preset: string;
  outputPath: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface ConfigFormState {
  inputType: 'asyncapi' | 'openapi' | 'jsonschema';
  generators: GeneratorFormState[];
  protocols: string[];
}

/**
 * Generate TypeScript config from form state.
 */
export function generateTsConfig(state: ConfigFormState): string {
  const enabledGenerators = state.generators.filter((g) => g.enabled);

  const generatorConfigs = enabledGenerators.map((g) => {
    const config: Record<string, unknown> = {
      preset: g.preset,
      outputPath: g.outputPath,
    };

    // Add protocols for channels/client generators
    if (g.preset === 'channels' || g.preset === 'client') {
      config.protocols = state.protocols;
    }

    // Add any additional options
    if (g.options) {
      Object.assign(config, g.options);
    }

    return formatGeneratorConfig(config);
  });

  return `import type { TheCodegenConfiguration } from '@the-codegen-project/cli';

const config: TheCodegenConfiguration = {
  inputType: '${state.inputType}',
  inputPath: './spec.yaml',
  language: 'typescript',
  generators: [
${generatorConfigs.map((c) => '    ' + c).join(',\n')}
  ]
};

export default config;
`;
}

function formatGeneratorConfig(config: Record<string, unknown>): string {
  const lines: string[] = ['{'];

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      lines.push(`  ${key}: [${value.map((v) => `'${v}'`).join(', ')}],`);
    } else if (typeof value === 'string') {
      lines.push(`  ${key}: '${value}',`);
    } else {
      lines.push(`  ${key}: ${JSON.stringify(value)},`);
    }
  }

  lines.push('}');
  return lines.join('\n    ');
}

/**
 * Get default form state.
 */
export function getDefaultFormState(): ConfigFormState {
  return {
    inputType: 'asyncapi',
    generators: [
      { preset: 'payloads', outputPath: './src/payloads', enabled: true },
      { preset: 'parameters', outputPath: './src/parameters', enabled: false },
      { preset: 'headers', outputPath: './src/headers', enabled: false },
      { preset: 'types', outputPath: './src/types', enabled: false },
      { preset: 'models', outputPath: './src/models', enabled: false },
      { preset: 'channels', outputPath: './src/channels', enabled: false },
      { preset: 'client', outputPath: './src/client', enabled: false },
    ],
    protocols: ['nats'],
  };
}

/**
 * Get default TypeScript config.
 */
export function getDefaultTsConfig(): string {
  return generateTsConfig(getDefaultFormState());
}
