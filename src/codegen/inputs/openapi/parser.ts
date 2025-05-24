import { parse, dereference } from '@readme/openapi-parser';
import { RunGeneratorContext } from '../../types';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';

export async function loadOpenapi(context: RunGeneratorContext) {
  const documentPath = context.documentPath;
  return loadOpenapiDocument(documentPath);
}

export async function loadOpenapiDocument(documentPath: string) {
  try {
    // Read the file content
    let documentContent: string;
    try {
      documentContent = readFileSync(documentPath, 'utf-8');
    } catch (error) {
      throw new Error(`Could not read OpenAPI document from '${documentPath}': ${error}`);
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
      throw new Error(`Could not parse OpenAPI document: ${error}`);
    }

    // Parse and validate the OpenAPI document
    const parsedDocument = await parse(document);

    // Dereference all $ref pointers to get a fully resolved document
    return await dereference(parsedDocument);
  } catch (error) {
    throw new Error(`Could not load OpenAPI document: ${error}`);
  }
}
