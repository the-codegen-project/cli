import {parse} from '@readme/openapi-parser';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import {InputAuthConfig, RunGeneratorContext} from '../../types';
import {readFileSync} from 'fs';
import {parse as parseYaml} from 'yaml';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {Logger} from '../../../LoggingInterface';
import {createInputDocumentError} from '../../errors';
import {isRemoteUrl} from '../../../utils/inputSource';
import {fetchRemoteDocument} from '../../../utils/remoteFetch';
import {createOpenapiRefParserResolver} from '../../../utils/refResolvers';

export async function loadOpenapi(
  context: RunGeneratorContext
): Promise<OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document> {
  return loadOpenapiDocument(context.documentPath, context.inputAuth);
}

export async function loadOpenapiDocument(
  documentPath: string,
  auth?: InputAuthConfig
): Promise<OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document> {
  Logger.verbose(`Loading OpenAPI document from ${documentPath}`);
  try {
    let documentContent: string;
    let contentType: string | null = null;

    if (isRemoteUrl(documentPath)) {
      const fetched = await fetchRemoteDocument(documentPath, auth);
      documentContent = fetched.content;
      contentType = fetched.contentType;
    } else {
      try {
        documentContent = readFileSync(documentPath, 'utf-8');
      } catch (error) {
        throw createInputDocumentError({
          inputPath: documentPath,
          inputType: 'openapi',
          errorMessage: `Could not read file: ${error}`
        });
      }
    }

    const document = parseDocumentContent(
      documentContent,
      documentPath,
      contentType
    );

    let dereferenced: any;
    if (isRemoteUrl(documentPath)) {
      // Use $RefParser directly so cross-spec $refs go through our
      // auth-aware http resolver. The root document is already in memory.
      const refParser = new $RefParser();
      dereferenced = await refParser.dereference(documentPath, document, {
        resolve: {
          http: createOpenapiRefParserResolver(auth, {rootUrl: documentPath})
        }
      });
    } else {
      // Local file path: keep the existing @readme/openapi-parser flow
      // which handles file:// $refs via the built-in resolver.
      const parsedDocument = await parse(document);
      const {dereference} = await import('@readme/openapi-parser');
      dereferenced = await dereference(parsedDocument);
    }

    // Run @readme/openapi-parser validation on the (already-dereferenced)
    // document so we still get OpenAPI 3.x-spec-aware error messages.
    if (isRemoteUrl(documentPath)) {
      try {
        await parse(JSON.parse(JSON.stringify(dereferenced)));
      } catch (validationError) {
        Logger.debug(
          `OpenAPI validation warning after dereferencing: ${validationError}`
        );
      }
    }

    Logger.debug(`OpenAPI document loaded and dereferenced`);
    return dereferenced;
  } catch (error) {
    if ((error as {type?: string})?.type) {
      // Already a CodegenError from a sub-step
      throw error;
    }
    throw createInputDocumentError({
      inputPath: documentPath,
      inputType: 'openapi',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
  }
}

function parseDocumentContent(
  content: string,
  documentPath: string,
  contentType: string | null
): any {
  const ct = contentType?.toLowerCase() ?? '';
  const isYaml =
    ct.includes('yaml') ||
    documentPath.endsWith('.yaml') ||
    documentPath.endsWith('.yml');
  const isJson = ct.includes('json') || documentPath.endsWith('.json');

  try {
    if (isYaml && !isJson) {
      return parseYaml(content);
    }
    if (isJson) {
      return JSON.parse(content);
    }
    // Ambiguous: try JSON first, then YAML.
    try {
      return JSON.parse(content);
    } catch {
      return parseYaml(content);
    }
  } catch (error) {
    throw createInputDocumentError({
      inputPath: documentPath,
      inputType: 'openapi',
      errorMessage: `Could not parse document: ${error}`
    });
  }
}
