import {JsonSchemaDocument} from '../parser';
import {Logger} from '../../../../LoggingInterface';

/**
 * Process JSON Schema document for models generation
 * Since the models generator works directly with the raw document,
 * we simply return the document as-is after validation.
 */
export function processJsonSchemaModels(
  jsonSchemaDocument: JsonSchemaDocument
): JsonSchemaDocument {
  if (!jsonSchemaDocument) {
    throw new Error('Expected JSON Schema input, was not given');
  }

  Logger.info('Processing JSON Schema document for models generation');

  // Validate that the document has content that can be used for model generation
  const hasType = jsonSchemaDocument.type !== undefined;
  const hasProperties = jsonSchemaDocument.properties !== undefined;
  const hasDefinitions =
    jsonSchemaDocument.definitions !== undefined ||
    jsonSchemaDocument.$defs !== undefined;

  if (!hasType && !hasProperties && !hasDefinitions) {
    Logger.warn(
      'JSON Schema document appears to have no definitions or type information for model generation'
    );
  }

  // For models generator, we return the document as-is since Modelina can work with raw JSON Schema
  return jsonSchemaDocument;
}
