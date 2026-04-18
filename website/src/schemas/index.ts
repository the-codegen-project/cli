/**
 * JSON Schemas for API specification validation.
 * Schemas are bundled locally for offline support and faster loading.
 */

// AsyncAPI schemas
import asyncapi200 from './asyncapi-2.0.0.json';
import asyncapi210 from './asyncapi-2.1.0.json';
import asyncapi220 from './asyncapi-2.2.0.json';
import asyncapi230 from './asyncapi-2.3.0.json';
import asyncapi240 from './asyncapi-2.4.0.json';
import asyncapi250 from './asyncapi-2.5.0.json';
import asyncapi260 from './asyncapi-2.6.0.json';
import asyncapi300 from './asyncapi-3.0.0.json';
import asyncapi310 from './asyncapi-3.1.0.json';

// OpenAPI schemas
import openapi30 from './openapi-3.0.json';
import openapi31 from './openapi-3.1.json';

// JSON Schema
import jsonschemaDraft07 from './jsonschema-draft-07.json';

export const schemas = {
  asyncapi: {
    '2.0.0': asyncapi200,
    '2.1.0': asyncapi210,
    '2.2.0': asyncapi220,
    '2.3.0': asyncapi230,
    '2.4.0': asyncapi240,
    '2.5.0': asyncapi250,
    '2.6.0': asyncapi260,
    '3.0.0': asyncapi300,
    '3.1.0': asyncapi310,
  },
  openapi: {
    '3.0': openapi30,
    '3.1': openapi31,
  },
  jsonschema: {
    'draft-07': jsonschemaDraft07,
  },
} as const;

/**
 * Detect the schema version from spec content.
 * Returns the appropriate schema for the detected version.
 * Supports both JSON and YAML content.
 */
export function detectSchema(
  content: string,
  inputType: 'asyncapi' | 'openapi' | 'jsonschema'
): object | null {
  if (!content.trim()) return null;

  try {
    if (inputType === 'asyncapi') {
      // Look for asyncapi version field (YAML or JSON)
      // YAML: asyncapi: '3.0.0' or asyncapi: "3.0.0"
      // JSON: "asyncapi": "3.0.0"
      const versionMatch = content.match(/["']?asyncapi["']?\s*[:=]\s*["']?(\d+\.\d+\.\d+)["']?/);
      if (versionMatch) {
        const version = versionMatch[1];
        if (version.startsWith('3.1')) {
          return asyncapi310;
        } else if (version.startsWith('3.0')) {
          return asyncapi300;
        } else if (version.startsWith('2.6')) {
          return asyncapi260;
        } else if (version.startsWith('2.5')) {
          return asyncapi250;
        } else if (version.startsWith('2.4')) {
          return asyncapi240;
        } else if (version.startsWith('2.3')) {
          return asyncapi230;
        } else if (version.startsWith('2.2')) {
          return asyncapi220;
        } else if (version.startsWith('2.1')) {
          return asyncapi210;
        } else {
          return asyncapi200;
        }
      }
      // Default to 3.0.0 for AsyncAPI
      return asyncapi300;
    }

    if (inputType === 'openapi') {
      // Look for openapi version field (YAML or JSON)
      const openapiMatch = content.match(/["']?openapi["']?\s*[:=]\s*["']?(\d+\.\d+)(?:\.\d+)?["']?/);
      if (openapiMatch) {
        const version = openapiMatch[1];
        if (version === '3.1') {
          return openapi31;
        }
        return openapi30;
      }
      // Look for swagger version (2.0)
      const swaggerMatch = content.match(/["']?swagger["']?\s*[:=]\s*["']?2\.0["']?/);
      if (swaggerMatch) {
        // No Swagger 2.0 schema bundled, use OpenAPI 3.0 as fallback
        return openapi30;
      }
      // Default to 3.0 for OpenAPI
      return openapi30;
    }

    if (inputType === 'jsonschema') {
      // Check for $schema field (JSON format)
      const schemaMatch = content.match(/["']\$schema["']\s*:\s*["']([^"']+)["']/);
      if (schemaMatch) {
        const schemaUri = schemaMatch[1];
        if (schemaUri.includes('draft-07') || schemaUri.includes('draft/7')) {
          return jsonschemaDraft07;
        }
      }
      // Default to draft-07 for JSON Schema
      return jsonschemaDraft07;
    }

    return null;
  } catch {
    return null;
  }
}

export type SchemaType = 'asyncapi' | 'openapi' | 'jsonschema';
