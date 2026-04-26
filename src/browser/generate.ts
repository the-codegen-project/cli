/**
 * Main browser generation function.
 * Uses the shared rendering pipeline for in-memory code generation.
 * No filesystem I/O - returns generated files as data.
 */
import {parse as parseYaml} from 'yaml';
import {parse, dereference} from '@readme/openapi-parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
// Use the shim's interface for browser compatibility, cast to any when passing to generators
// that expect @asyncapi/parser.AsyncAPIDocumentInterface
import {AsyncAPIDocumentInterface} from './shims/asyncapi-parser';
import type {AsyncAPIDocumentInterface as NodeAsyncAPIDocumentInterface} from '@asyncapi/parser';
import {CodegenError} from '../codegen/errors';
import {loadAsyncapiFromMemoryBrowser} from './parser';
import {
  loadJsonSchemaFromMemory,
  JsonSchemaDocument
} from '../codegen/inputs/jsonschema';
import {
  TheCodegenConfiguration,
  TheCodegenConfigurationInternal,
  zodTheCodegenConfiguration,
  RunGeneratorContext
} from '../codegen/types';
import {realizeConfiguration} from '../codegen/configurations';
import {determineRenderGraph, renderGraph} from '../codegen/renderer';

export interface BrowserGenerateInput {
  /** The API specification as a string (YAML or JSON) */
  spec: string;
  /** The format of the specification */
  specFormat: 'asyncapi' | 'openapi' | 'jsonschema';
  /** The codegen configuration */
  config: TheCodegenConfiguration;
}

export interface BrowserGenerateOutput {
  /** Generated files as Record<path, content> */
  files: Record<string, string>;
  /** Any errors that occurred during generation */
  errors: string[];
}

/**
 * Generate code from an API specification in the browser.
 * This is the main entry point for browser-based code generation.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generate(
  input: BrowserGenerateInput
): Promise<BrowserGenerateOutput> {
  const errors: string[] = [];
  const files: Record<string, string> = {};

  try {
    // Validate and realize configuration (adds default generators for dependencies)
    const configResult = zodTheCodegenConfiguration.safeParse(input.config);
    if (!configResult.success) {
      errors.push(
        `Invalid configuration: ${configResult.error.issues.map((i) => i.message).join(', ')}`
      );
      return {files, errors};
    }

    // Realize configuration to add dependency generators and merge with defaults
    const config: TheCodegenConfigurationInternal = realizeConfiguration(
      configResult.data
    );

    // Parse the specification
    let asyncapiDocument: AsyncAPIDocumentInterface | undefined;
    let openapiDocument:
      | OpenAPIV3.Document
      | OpenAPIV2.Document
      | OpenAPIV3_1.Document
      | undefined;
    let jsonSchemaDocument: JsonSchemaDocument | undefined;

    // Validate spec is not empty
    if (!input.spec || input.spec.trim() === '') {
      errors.push('Empty specification provided');
      return {files, errors};
    }

    switch (input.specFormat) {
      case 'asyncapi':
        try {
          asyncapiDocument = await loadAsyncapiFromMemoryBrowser(input.spec);
        } catch (error) {
          // Include details from CodegenError if available
          let errorMsg = error instanceof Error ? error.message : String(error);
          if (error instanceof CodegenError && error.details) {
            errorMsg += `\n${error.details}`;
          }
          errors.push(`Failed to parse AsyncAPI spec: ${errorMsg}`);
          return {files, errors};
        }
        break;

      case 'openapi':
        try {
          openapiDocument = await parseOpenAPIFromMemory(input.spec);
        } catch (error) {
          errors.push(
            `Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`
          );
          return {files, errors};
        }
        break;

      case 'jsonschema':
        try {
          const parsed = parseSpecString(input.spec);
          jsonSchemaDocument = loadJsonSchemaFromMemory(
            parsed as JsonSchemaDocument
          );
        } catch (error) {
          errors.push(
            `Failed to parse JSON Schema: ${error instanceof Error ? error.message : String(error)}`
          );
          return {files, errors};
        }
        break;

      default:
        errors.push(`Unknown spec format: ${input.specFormat}`);
        return {files, errors};
    }

    // Cast the browser shim's AsyncAPIDocumentInterface to the Node.js version
    // At runtime, the objects are compatible - this is just for TypeScript
    const nodeAsyncapiDocument = asyncapiDocument as
      | NodeAsyncAPIDocumentInterface
      | undefined;

    // Build the context for the shared rendering pipeline
    // Use root-level virtual path so output paths don't get 'browser/' prefix
    const context: RunGeneratorContext = {
      configuration: config,
      configFilePath: '/virtual-config.mjs', // Virtual path for browser (root level)
      documentPath: '/virtual-spec',
      asyncapiDocument: nodeAsyncapiDocument,
      openapiDocument,
      jsonSchemaDocument
    };

    // Use the shared rendering pipeline
    const graph = determineRenderGraph(context);
    const result = await renderGraph(context, graph);

    // Convert GeneratedFile[] to Record<string, string>
    for (const file of result.files) {
      files[file.path] = file.content;
    }
  } catch (error) {
    errors.push(
      `Generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {files, errors};
}

/**
 * Parse an OpenAPI spec from a string.
 */
async function parseOpenAPIFromMemory(
  specString: string
): Promise<OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document> {
  const document = parseSpecString(specString);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedDocument = await parse(document as any);
  return await dereference(parsedDocument);
}

/**
 * Parse a spec string (YAML or JSON) into an object.
 */
function parseSpecString(specString: string): unknown {
  // Try JSON first
  try {
    return JSON.parse(specString);
  } catch {
    // Fall back to YAML
    return parseYaml(specString);
  }
}
