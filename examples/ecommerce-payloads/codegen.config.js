/**
 * Configuration file for generating payload models from the e-commerce AsyncAPI specification
 * 
 * This configuration demonstrates how to set up The Codegen Project to generate
 * TypeScript payload models with validation from an AsyncAPI document.
 * 
 * Usage:
 * 1. Place this file in your project root
 * 2. Run: npx @the-codegen-project/cli generate
 * 
 * The generated models will include:
 * - Type-safe TypeScript classes
 * - JSON Schema validation
 * - Serialization/deserialization methods
 * - Support for complex nested objects, unions, and circular references
 */

/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
  // Input specification type and path
  inputType: 'asyncapi',
  inputPath: './ecommerce-order-system.yaml',
  
  // Global language setting
  language: 'typescript',
  
  // Generator configuration
  generators: [
    {
      // Use the payloads preset for generating data models
      preset: 'payloads',
      
      // Output directory for generated models
      outputPath: './src/generated/models',
      
      // Include JSON Schema validation methods
      includeValidation: true,
      
      // Serialization type
      serializationType: 'json'
    }
  ]
}; 