import {Logger} from '../../../LoggingInterface';
import {InputAuthConfig, RunGeneratorContext} from '../../types';
import fs from 'fs';
import {parse as parseYaml} from 'yaml';
import {createInputDocumentError} from '../../errors';
import {isRemoteUrl} from '../../../utils/inputSource';
import {fetchRemoteDocument} from '../../../utils/remoteFetch';

export interface JsonSchemaDocument {
  [key: string]: any;
  $schema?: string;
  type?: string;
  properties?: {[key: string]: any};
  definitions?: {[key: string]: any};
  $defs?: {[key: string]: any};
}

/**
 * Load JSON Schema document from file path or remote URL in context.
 */
export async function loadJsonSchema(
  context: RunGeneratorContext
): Promise<JsonSchemaDocument> {
  return loadJsonSchemaDocument(context.documentPath, context.inputAuth);
}

/**
 * Load JSON Schema document from a file path or http(s) URL.
 *
 * URL format detection: prefers `Content-Type` (`application/json` →
 * JSON, `*yaml*` → YAML), falls back to URL extension, then to
 * JSON-first-then-YAML for ambiguous cases.
 */
export async function loadJsonSchemaDocument(
  filePath: string,
  auth?: InputAuthConfig
): Promise<JsonSchemaDocument> {
  Logger.verbose(`Loading JSON Schema document from ${filePath}`);

  try {
    let content: string;
    let contentType: string | null = null;

    if (isRemoteUrl(filePath)) {
      const fetched = await fetchRemoteDocument(filePath, auth);
      content = fetched.content;
      contentType = fetched.contentType;
    } else {
      if (
        !filePath.endsWith('.json') &&
        !filePath.endsWith('.yaml') &&
        !filePath.endsWith('.yml')
      ) {
        throw createInputDocumentError({
          inputPath: filePath,
          inputType: 'jsonschema',
          errorMessage: `Unsupported file format. Use .json, .yaml, or .yml`
        });
      }
      content = fs.readFileSync(filePath, 'utf8');
    }

    const document = parseDocument(content, filePath, contentType);
    validateJsonSchemaDocument(document, filePath);
    return document;
  } catch (error) {
    if ((error as {type?: string})?.type) {
      throw error;
    }
    if (error instanceof Error) {
      throw createInputDocumentError({
        inputPath: filePath,
        inputType: 'jsonschema',
        errorMessage: error.message
      });
    }
    throw createInputDocumentError({
      inputPath: filePath,
      inputType: 'jsonschema',
      errorMessage: 'Unknown error'
    });
  }
}

function parseDocument(
  content: string,
  source: string,
  contentType: string | null
): JsonSchemaDocument {
  const ct = contentType?.toLowerCase() ?? '';
  const isYaml =
    ct.includes('yaml') || source.endsWith('.yaml') || source.endsWith('.yml');
  const isJson = ct.includes('json') || source.endsWith('.json');

  if (isJson && !isYaml) {
    return JSON.parse(content);
  }
  if (isYaml && !isJson) {
    return parseYaml(content);
  }
  // Ambiguous → JSON-first-then-YAML.
  try {
    return JSON.parse(content);
  } catch {
    return parseYaml(content);
  }
}

/**
 * Load JSON Schema document from memory.
 */
export function loadJsonSchemaFromMemory(
  document: JsonSchemaDocument,
  documentPath?: string
): JsonSchemaDocument {
  const path = documentPath || 'memory';
  Logger.verbose(`Loading JSON Schema document from ${path}`);

  validateJsonSchemaDocument(document, path);
  return document;
}

/**
 * Basic validation for JSON Schema document.
 */
function validateJsonSchemaDocument(
  document: JsonSchemaDocument,
  source: string
): void {
  if (!document || typeof document !== 'object') {
    throw createInputDocumentError({
      inputPath: source,
      inputType: 'jsonschema',
      errorMessage: 'Document must be an object'
    });
  }

  if (document.$schema && typeof document.$schema !== 'string') {
    throw createInputDocumentError({
      inputPath: source,
      inputType: 'jsonschema',
      errorMessage: '$schema must be a string'
    });
  }

  if (!document.$schema) {
    Logger.warn(
      `JSON Schema document from ${source} does not specify a $schema version. Consider adding one for better validation.`
    );
  }

  const hasType = document.type !== undefined;
  const hasProperties = document.properties !== undefined;
  const hasDefinitions =
    document.definitions !== undefined || document.$defs !== undefined;

  if (!hasType && !hasProperties && !hasDefinitions) {
    Logger.warn(
      `JSON Schema document from ${source} appears to be empty or incomplete. It should have 'type', 'properties', 'definitions', or '$defs' for code generation.`
    );
  }

  Logger.debug(`Successfully validated JSON Schema document from ${source}`);
}
