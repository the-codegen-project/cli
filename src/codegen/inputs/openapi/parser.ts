import {parse, dereference} from '@readme/openapi-parser';
import {RunGeneratorContext} from '../../types';
import {readFileSync} from 'fs';
import {parse as parseYaml} from 'yaml';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {Logger} from '../../../LoggingInterface';
import {createInputDocumentError} from '../../errors';

export async function loadOpenapi(
  context: RunGeneratorContext
): Promise<OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document> {
  const documentPath = context.documentPath;
  return loadOpenapiDocument(documentPath);
}

export async function loadOpenapiDocument(
  documentPath: string
): Promise<OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document> {
  Logger.verbose(`Loading OpenAPI document from ${documentPath}`);
  try {
    // Read the file content
    let documentContent: string;
    try {
      documentContent = readFileSync(documentPath, 'utf-8');
    } catch (error) {
      throw createInputDocumentError({
        inputPath: documentPath,
        inputType: 'openapi',
        errorMessage: `Could not read file: ${error}`
      });
    }

    // Parse the document (support both JSON and YAML)
    let document: any;
    try {
      if (documentPath.endsWith('.yaml') || documentPath.endsWith('.yml')) {
        document = parseYaml(documentContent);
      } else {
        document = JSON.parse(documentContent);
      }
    } catch (error) {
      throw createInputDocumentError({
        inputPath: documentPath,
        inputType: 'openapi',
        errorMessage: `Could not parse document: ${error}`
      });
    }

    // Parse and validate the OpenAPI document
    const parsedDocument = await parse(document);

    // Dereference all $ref pointers to get a fully resolved document
    const result = await dereference(parsedDocument);
    Logger.debug(`OpenAPI document loaded and dereferenced`);
    return result;
  } catch (error) {
    throw createInputDocumentError({
      inputPath: documentPath,
      inputType: 'openapi',
      errorMessage: String(error)
    });
  }
}
