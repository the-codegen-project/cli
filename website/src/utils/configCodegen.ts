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

export type InputType = ConfigFormState['inputType'];

/**
 * Which input types each generator preset supports.
 * JSON Schema only supports `models` / `custom`; all others are AsyncAPI/OpenAPI only.
 */
export const PRESET_COMPATIBILITY: Record<string, InputType[]> = {
  payloads: ['asyncapi', 'openapi'],
  parameters: ['asyncapi', 'openapi'],
  headers: ['asyncapi', 'openapi'],
  types: ['asyncapi', 'openapi'],
  models: ['asyncapi', 'openapi', 'jsonschema'],
  channels: ['asyncapi', 'openapi'],
  client: ['asyncapi'],
};

/**
 * Which input types each protocol is compatible with.
 * Messaging protocols are AsyncAPI-only; http_client works for both AsyncAPI and OpenAPI.
 */
export const PROTOCOL_INPUT_COMPATIBILITY: Record<string, InputType[]> = {
  nats: ['asyncapi'],
  kafka: ['asyncapi'],
  mqtt: ['asyncapi'],
  amqp: ['asyncapi'],
  websocket: ['asyncapi'],
  event_source: ['asyncapi'],
  http_client: ['asyncapi', 'openapi'],
};

/**
 * Build a full form state seeded with sensible defaults for the given input type.
 * Called whenever the input type changes (auto-detect, example picker) to
 * rebuild enabled presets/protocols so the form never ends up in an invalid
 * state that would throw at generation time.
 */
export function getDefaultFormStateForInputType(
  inputType: InputType
): ConfigFormState {
  const baseGenerators: GeneratorFormState[] = [
    { preset: 'payloads', outputPath: './src/payloads', enabled: false },
    { preset: 'parameters', outputPath: './src/parameters', enabled: false },
    { preset: 'headers', outputPath: './src/headers', enabled: false },
    { preset: 'types', outputPath: './src/types', enabled: false },
    { preset: 'models', outputPath: './src/models', enabled: false },
    { preset: 'channels', outputPath: './src/channels', enabled: false },
    { preset: 'client', outputPath: './src/client', enabled: false },
  ];

  const enableByInput: Record<InputType, string> = {
    asyncapi: 'payloads',
    openapi: 'payloads',
    jsonschema: 'models',
  };
  const enabledPreset = enableByInput[inputType];
  const generators = baseGenerators.map((g) =>
    g.preset === enabledPreset ? { ...g, enabled: true } : g
  );

  const protocolsByInput: Record<InputType, string[]> = {
    asyncapi: ['nats'],
    openapi: ['http_client'],
    jsonschema: [],
  };

  return { inputType, generators, protocols: protocolsByInput[inputType] };
}

/**
 * Get default form state (AsyncAPI).
 */
export function getDefaultFormState(): ConfigFormState {
  return getDefaultFormStateForInputType('asyncapi');
}

/**
 * Get default JSON config.
 */
export function getDefaultJsonConfig(): string {
  return generateJsonConfig(getDefaultFormState());
}
