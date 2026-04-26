/**
 * Browser bundle entry point.
 * Exports browser-compatible generation functions for use in web applications.
 *
 * This module provides:
 * - generate() - Main function to generate code from API specs
 * - parseConfig() - Parse configuration from JSON/YAML strings
 * - BrowserOutput - In-memory file storage
 * - MemoryAdapter - Shared in-memory output adapter
 */

// Main generation function
export {generate} from './generate';
export type {BrowserGenerateInput, BrowserGenerateOutput} from './generate';

// Configuration parsing
export {parseConfig, serializeConfig} from './config';

// Adapters for direct usage
export {BrowserOutput} from './adapters/output';

// Re-export shared MemoryAdapter for direct usage
export {MemoryAdapter} from '../codegen/output';
export type {OutputAdapter} from '../codegen/output';

// Re-export types that users might need
export type {TheCodegenConfiguration} from '../codegen/types';
