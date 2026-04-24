/**
 * Generate JSON config from form state.
 * Used to sync form changes → JSON editor.
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
 * Generate JSON config from form state.
 */
export function generateJsonConfig(state: ConfigFormState): string {
  const enabledGenerators = state.generators.filter((g) => g.enabled);

  const config = {
    inputType: state.inputType,
    inputPath: './spec.yaml',
    language: 'typescript',
    generators: enabledGenerators.map((g) => {
      const genConfig: Record<string, unknown> = {
        preset: g.preset,
        outputPath: g.outputPath,
      };

      // Add protocols for channels/client generators
      if (g.preset === 'channels' || g.preset === 'client') {
        genConfig.protocols = state.protocols;
      }

      // Add any additional options
      if (g.options) {
        Object.assign(genConfig, g.options);
      }

      return genConfig;
    }),
  };

  return JSON.stringify(config, null, 2);
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
 * Get default JSON config.
 */
export function getDefaultJsonConfig(): string {
  return generateJsonConfig(getDefaultFormState());
}
