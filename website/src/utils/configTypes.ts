/**
 * TypeScript type definitions for Monaco IntelliSense in the config editor.
 * These types are registered with Monaco to provide auto-suggestions.
 */

/**
 * Get the TypeScript definition source for Monaco addExtraLib.
 * This provides IntelliSense for TheCodegenConfiguration.
 */
export function getConfigTypeDefinitions(): string {
  return `
// Type definitions for @the-codegen-project/cli
// These provide IntelliSense in the playground config editor

declare module '@the-codegen-project/cli' {
  /** Input specification type */
  export type InputType = 'asyncapi' | 'openapi' | 'jsonschema';

  /** Target language for code generation */
  export type Language = 'typescript';

  /** Serialization format for payloads */
  export type SerializationType = 'json' | 'yaml' | 'msgpack' | 'avro' | 'protobuf';

  /** Supported protocols for channels generator */
  export type ChannelsProtocol =
    | 'nats'
    | 'kafka'
    | 'mqtt'
    | 'amqp'
    | 'websocket'
    | 'http_client'
    | 'event_source';

  /** Supported protocols for client generator (currently only NATS) */
  export type ClientProtocol = 'nats';

  /** Payloads generator - generates message payload models with validation */
  export interface PayloadsGenerator {
    /** Generator preset type */
    preset: 'payloads';
    /** Output directory for generated files */
    outputPath: string;
    /** Serialization format (default: 'json') */
    serializationType?: SerializationType;
    /** Message ID mapping */
    map?: {
      messageId?: string;
    };
  }

  /** Parameters generator - generates channel parameter models */
  export interface ParametersGenerator {
    /** Generator preset type */
    preset: 'parameters';
    /** Output directory for generated files */
    outputPath: string;
  }

  /** Headers generator - generates message header models */
  export interface HeadersGenerator {
    /** Generator preset type */
    preset: 'headers';
    /** Output directory for generated files */
    outputPath: string;
  }

  /** Types generator - generates simple type definitions */
  export interface TypesGenerator {
    /** Generator preset type */
    preset: 'types';
    /** Output directory for generated files */
    outputPath: string;
  }

  /** Models generator - generates data models from schemas */
  export interface ModelsGenerator {
    /** Generator preset type */
    preset: 'models';
    /** Output directory for generated files */
    outputPath: string;
  }

  /** Channels generator - generates protocol-specific publish/subscribe functions */
  export interface ChannelsGenerator {
    /** Generator preset type */
    preset: 'channels';
    /** Output directory for generated files */
    outputPath: string;
    /** Protocols to generate code for (nats, kafka, mqtt, amqp, websocket, http_client, event_source) */
    protocols: ChannelsProtocol[];
  }

  /** Client generator - generates full client with connection management */
  export interface ClientGenerator {
    /** Generator preset type */
    preset: 'client';
    /** Output directory for generated files */
    outputPath: string;
    /** Protocols to generate code for (currently only 'nats' is supported) */
    protocols: ClientProtocol[];
  }

  /** Custom generator - user-defined code generation */
  export interface CustomGenerator {
    /** Generator preset type */
    preset: 'custom';
    /** Output directory for generated files */
    outputPath: string;
    /** Custom render function */
    renderFunction: (context: any) => string;
  }

  /** Union of all generator types */
  export type Generator =
    | PayloadsGenerator
    | ParametersGenerator
    | HeadersGenerator
    | TypesGenerator
    | ModelsGenerator
    | ChannelsGenerator
    | ClientGenerator
    | CustomGenerator;

  /** Main configuration interface for The Codegen Project */
  export interface TheCodegenConfiguration {
    /** Type of input specification */
    inputType: InputType;
    /** Path to the input specification file */
    inputPath: string;
    /** Target language for generated code */
    language: Language;
    /** List of generators to run */
    generators: Generator[];
  }
}

// Global type declarations for better autocomplete
declare global {
  type InputType = 'asyncapi' | 'openapi' | 'jsonschema';
  type Language = 'typescript';
  type SerializationType = 'json' | 'yaml' | 'msgpack' | 'avro' | 'protobuf';
  type ChannelsProtocol = 'nats' | 'kafka' | 'mqtt' | 'amqp' | 'websocket' | 'http_client' | 'event_source';
  type ClientProtocol = 'nats';
}
`;
}

/**
 * Setup Monaco TypeScript IntelliSense with config types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupMonacoTypes(monaco: any): void {
  // Monaco types are available at runtime, but the TypeScript definitions
  // from @monaco-editor/react don't fully expose them. We use any here.
  const typescript = monaco.languages?.typescript;
  if (!typescript?.typescriptDefaults) {
    console.warn('Monaco TypeScript not available');
    return;
  }

  // Configure TypeScript compiler options
  typescript.typescriptDefaults.setCompilerOptions({
    target: typescript.ScriptTarget?.ESNext ?? 99,
    module: typescript.ModuleKind?.ESNext ?? 99,
    moduleResolution: typescript.ModuleResolutionKind?.NodeJs ?? 2,
    allowNonTsExtensions: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
  });

  // Suppress module resolution errors for playground
  typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    // Ignore "Cannot find module" errors (2307)
    diagnosticCodesToIgnore: [2307],
  });

  // Add the type definitions for @the-codegen-project/cli
  typescript.typescriptDefaults.addExtraLib(
    getConfigTypeDefinitions(),
    'file:///node_modules/@types/the-codegen-project__cli/index.d.ts'
  );

  // Also add with the direct module path
  typescript.typescriptDefaults.addExtraLib(
    getConfigTypeDefinitions(),
    'file:///node_modules/@the-codegen-project/cli/index.d.ts'
  );
}
