/**
 * Configuration file for generating header models from the e-commerce AsyncAPI specification
 * 
 * This configuration demonstrates how to set up The Codegen Project to generate
 * TypeScript header models from an AsyncAPI document.
 * 
 * Usage:
 * 1. Place this file in your project root
 * 2. Run: npx @the-codegen-project/cli generate
 * 
 * The generated models will include:
 * - Type-safe TypeScript classes for message headers
 * - Serialization/deserialization methods
 * - Support for complex header patterns like authentication, tracing, and metadata
 */

/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
  // Input specification type and path
  inputType: 'asyncapi',
  inputPath: './ecommerce-messaging-system.yaml',
  
  // Global language setting
  language: 'typescript',
  
  // Generator configuration
  generators: [
    {
      // Use the headers preset for generating header models
      preset: 'headers',
      
      // Output directory for generated header models
      outputPath: './src/generated/headers',
      
      // Serialization type
      serializationType: 'json'
    }
  ]
}; 