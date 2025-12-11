/**
 * Telemetry event type definitions
 */

/**
 * Base telemetry event interface
 */
export interface TelemetryEvent {
  event: string;
  [key: string]: any;
}

/**
 * Command execution event
 */
export interface CommandExecutedEvent extends TelemetryEvent {
  event: 'command_executed';
  command: string;
  flags: string[];
  input_source?: 'remote_url' | 'local_relative' | 'local_absolute';
  input_type?: 'asyncapi' | 'openapi' | 'jsonschema';
  generators?: string[]; // List of generator presets used together
  generator_count?: number; // Number of generators used
  duration: number;
  success: boolean;
  error_type?: string;
  cli_version: string;
  node_version: string;
  os: string;
  ci: boolean;
}

/**
 * Generator usage event
 */
export interface GeneratorUsedEvent extends TelemetryEvent {
  event: 'generator_used';
  generator_type: string;
  input_type: 'asyncapi' | 'openapi' | 'jsonschema';
  input_source?: 'remote_url' | 'local_relative' | 'local_absolute';
  language: string;
  options: Record<string, any>;
  duration: number;
  success: boolean;
}

/**
 * Init command event
 */
export interface InitExecutedEvent extends TelemetryEvent {
  event: 'init_executed';
  config_type: 'esm' | 'json' | 'yaml' | 'ts';
  input_type?: string;
  generators: string[];
  language?: string;
  completed: boolean;
}

/**
 * Error event
 */
export interface ErrorOccurredEvent extends TelemetryEvent {
  event: 'error_occurred';
  command: string;
  error_type: string;
  error_code?: string;
  cli_version: string;
  node_version: string;
}

/**
 * Watch mode event
 */
export interface WatchModeEvent extends TelemetryEvent {
  event: 'watch_mode_started';
  command: string;
  watch_duration?: number;
}
