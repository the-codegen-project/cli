import {Logger} from '../../../LoggingInterface';
import {RunGeneratorContext} from '../../types';
import fs from 'fs';
import {createInputDocumentError} from '../../errors';

export interface JsonSchemaDocument {
  [key: string]: any;
  $schema?: string;
  type?: string;
  properties?: {[key: string]: any};
  definitions?: {[key: string]: any};
  $defs?: {[key: string]: any};
}

/**
 * Load JSON Schema document from file path in context
 */
export async function loadJsonSchema(
  context: RunGeneratorContext
): Promise<JsonSchemaDocument> {
  const {documentPath} = context;
  Logger.verbose(`Loading JSON Schema document from ${documentPath}`);

  try {
    const fileContent = fs.readFileSync(documentPath, 'utf8');
    let document: JsonSchemaDocument;

    if (documentPath.endsWith('.json')) {
      document = JSON.parse(fileContent);
    } else if (
      documentPath.endsWith('.yaml') ||
      documentPath.endsWith('.yml')
    ) {
      // Import yaml dynamically to avoid circular dependencies
      const yaml = await import('yaml');
      document = yaml.parse(fileContent);
    } else {
      throw createInputDocumentError({
        inputPath: documentPath,
        inputType: 'jsonschema',
        errorMessage: `Unsupported file format. Use .json, .yaml, or .yml`
      });
    }

    validateJsonSchemaDocument(document, documentPath);
    return document;
  } catch (error) {
    if (error instanceof Error) {
      throw createInputDocumentError({
        inputPath: documentPath,
        inputType: 'jsonschema',
        errorMessage: error.message
      });
    }
    throw createInputDocumentError({
      inputPath: documentPath,
      inputType: 'jsonschema',
      errorMessage: 'Unknown error'
    });
  }
}

/**
 * Load JSON Schema document from file path directly
 */
export async function loadJsonSchemaDocument(
  filePath: string
): Promise<JsonSchemaDocument> {
  Logger.verbose(`Loading JSON Schema document from ${filePath}`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let document: JsonSchemaDocument;

    if (filePath.endsWith('.json')) {
      document = JSON.parse(fileContent);
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      // Import yaml dynamically to avoid circular dependencies
      const yaml = await import('yaml');
      document = yaml.parse(fileContent);
    } else {
      throw createInputDocumentError({
        inputPath: filePath,
        inputType: 'jsonschema',
        errorMessage: `Unsupported file format. Use .json, .yaml, or .yml`
      });
    }

    validateJsonSchemaDocument(document, filePath);
    return document;
  } catch (error) {
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

/**
 * Load JSON Schema document from memory
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
 * Basic validation for JSON Schema document
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

  // Basic JSON Schema structure validation
  if (document.$schema && typeof document.$schema !== 'string') {
    throw createInputDocumentError({
      inputPath: source,
      inputType: 'jsonschema',
      errorMessage: '$schema must be a string'
    });
  }

  // Warn if no $schema is specified
  if (!document.$schema) {
    Logger.warn(
      `JSON Schema document from ${source} does not specify a $schema version. Consider adding one for better validation.`
    );
  }

  // Must have at least type or properties or definitions/$defs to be useful for code generation
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
