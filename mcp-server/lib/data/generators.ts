/**
 * Generator definitions and schemas for The Codegen Project.
 * This data is used by MCP tools to help users configure generators.
 */

export type InputType = 'asyncapi' | 'openapi' | 'jsonschema';
export type GeneratorPreset =
  | 'payloads'
  | 'parameters'
  | 'headers'
  | 'types'
  | 'channels'
  | 'client'
  | 'models'
  | 'custom';
export type Protocol =
  | 'nats'
  | 'kafka'
  | 'mqtt'
  | 'amqp'
  | 'websocket'
  | 'http_client'
  | 'event_source';

export interface GeneratorOption {
  name: string;
  type: 'string' | 'boolean' | 'array' | 'enum' | 'object';
  description: string;
  default?: unknown;
  required?: boolean;
  enumValues?: string[];
}

export interface GeneratorDefinition {
  preset: GeneratorPreset;
  description: string;
  supportedInputs: InputType[];
  defaultOutputPath: string;
  options: GeneratorOption[];
  dependencies?: GeneratorPreset[];
}

/**
 * All available generators and their configurations
 */
export const generators: Record<GeneratorPreset, GeneratorDefinition> = {
  payloads: {
    preset: 'payloads',
    description:
      'Generates TypeScript classes/types for message payloads with JSON serialization and AJV validation.',
    supportedInputs: ['asyncapi', 'openapi'],
    defaultOutputPath: 'src/__gen__/payloads',
    options: [
      {
        name: 'serializationType',
        type: 'enum',
        description: 'Serialization format for messages',
        default: 'json',
        enumValues: ['json'],
      },
      {
        name: 'enum',
        type: 'enum',
        description: 'How to generate enum types',
        default: 'enum',
        enumValues: ['enum', 'union'],
      },
      {
        name: 'map',
        type: 'enum',
        description: 'How to generate map/dictionary types',
        default: 'record',
        enumValues: ['indexedObject', 'map', 'record'],
      },
      {
        name: 'includeValidation',
        type: 'boolean',
        description: 'Include AJV validation in generated payloads',
        default: true,
      },
      {
        name: 'useForJavaScript',
        type: 'boolean',
        description: 'Generate code compatible with plain JavaScript',
        default: true,
      },
      {
        name: 'rawPropertyNames',
        type: 'boolean',
        description: 'Use raw property names without transformation',
        default: false,
      },
    ],
  },

  parameters: {
    preset: 'parameters',
    description:
      'Generates TypeScript classes for channel/path parameters with extraction and substitution methods.',
    supportedInputs: ['asyncapi', 'openapi'],
    defaultOutputPath: 'src/__gen__/parameters',
    options: [
      {
        name: 'serializationType',
        type: 'enum',
        description: 'Serialization format',
        default: 'json',
        enumValues: ['json'],
      },
    ],
  },

  headers: {
    preset: 'headers',
    description:
      'Generates TypeScript classes for message headers with validation.',
    supportedInputs: ['asyncapi', 'openapi'],
    defaultOutputPath: 'src/__gen__/headers',
    options: [
      {
        name: 'serializationType',
        type: 'enum',
        description: 'Serialization format',
        default: 'json',
        enumValues: ['json'],
      },
      {
        name: 'includeValidation',
        type: 'boolean',
        description: 'Include AJV validation in generated headers',
        default: true,
      },
    ],
  },

  types: {
    preset: 'types',
    description:
      'Generates TypeScript type definitions for topics/channels with mapping utilities.',
    supportedInputs: ['asyncapi', 'openapi'],
    defaultOutputPath: 'src/__gen__',
    options: [],
  },

  channels: {
    preset: 'channels',
    description:
      'Generates protocol-specific messaging functions (publish, subscribe, request, reply) for each channel.',
    supportedInputs: ['asyncapi'],
    defaultOutputPath: 'src/__gen__/channels',
    dependencies: ['payloads', 'parameters', 'headers'],
    options: [
      {
        name: 'protocols',
        type: 'array',
        description: 'Protocols to generate functions for',
        required: true,
        enumValues: [
          'nats',
          'kafka',
          'mqtt',
          'amqp',
          'websocket',
          'http_client',
          'event_source',
        ],
      },
      {
        name: 'asyncapiReverseOperations',
        type: 'boolean',
        description: 'Reverse the direction of operations (send becomes receive)',
        default: false,
      },
      {
        name: 'asyncapiGenerateForOperations',
        type: 'boolean',
        description: 'Generate functions based on operations',
        default: true,
      },
      {
        name: 'kafkaTopicSeparator',
        type: 'string',
        description: 'Topic separator for Kafka channels',
        default: '.',
      },
      {
        name: 'eventSourceDependency',
        type: 'string',
        description: 'NPM package for EventSource implementation',
        default: '@microsoft/fetch-event-source',
      },
    ],
  },

  client: {
    preset: 'client',
    description:
      'Generates a high-level client class that wraps channel functions with connection management.',
    supportedInputs: ['asyncapi'],
    defaultOutputPath: 'src/__gen__/client',
    dependencies: ['channels'],
    options: [
      {
        name: 'protocols',
        type: 'array',
        description: 'Protocols to generate clients for (currently only NATS supported)',
        required: true,
        enumValues: ['nats'],
      },
    ],
  },

  models: {
    preset: 'models',
    description:
      'Generates TypeScript data models using Modelina with customizable presets.',
    supportedInputs: ['asyncapi', 'openapi', 'jsonschema'],
    defaultOutputPath: 'src/__gen__/models',
    options: [
      {
        name: 'options',
        type: 'object',
        description: 'Modelina TypeScript options (modelType, enumType, indentation, etc.)',
      },
      {
        name: 'renderers',
        type: 'array',
        description: 'Custom Modelina presets for code customization',
      },
    ],
  },

  custom: {
    preset: 'custom',
    description:
      'Run a custom generator function for specialized code generation needs.',
    supportedInputs: ['asyncapi', 'openapi', 'jsonschema'],
    defaultOutputPath: 'custom',
    options: [
      {
        name: 'renderFunction',
        type: 'object',
        description: 'Custom function that receives context and returns generated code',
        required: true,
      },
      {
        name: 'options',
        type: 'object',
        description: 'Custom options passed to the render function',
      },
    ],
  },
};

/**
 * Get generators available for a specific input type
 */
export function getGeneratorsForInput(inputType: InputType): GeneratorDefinition[] {
  return Object.values(generators).filter((g) =>
    g.supportedInputs.includes(inputType)
  );
}

/**
 * Get generator by preset name
 */
export function getGenerator(preset: GeneratorPreset): GeneratorDefinition | undefined {
  return generators[preset];
}

/**
 * Input type compatibility matrix
 */
export const inputTypeGenerators: Record<InputType, GeneratorPreset[]> = {
  asyncapi: ['payloads', 'parameters', 'headers', 'types', 'channels', 'client', 'models', 'custom'],
  openapi: ['payloads', 'parameters', 'headers', 'types', 'models', 'custom'],
  jsonschema: ['models', 'custom'],
};

/**
 * Protocol descriptions
 */
export const protocolDescriptions: Record<Protocol, string> = {
  nats: 'NATS messaging with support for core pub/sub, request/reply, and JetStream',
  kafka: 'Apache Kafka with consumer groups and topic management',
  mqtt: 'MQTT protocol with QoS levels and topic wildcards',
  amqp: 'AMQP 0-9-1 (RabbitMQ) with queues and exchanges',
  websocket: 'WebSocket bidirectional messaging for real-time communication',
  http_client: 'HTTP/REST client with various authentication methods',
  event_source: 'Server-Sent Events (SSE) for server-to-client streaming',
};
