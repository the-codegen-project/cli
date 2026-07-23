import {Parser} from '@asyncapi/parser';
import {AvroSchemaParser} from '@asyncapi/avro-schema-parser';
import {OpenAPISchemaParser} from '@asyncapi/openapi-schema-parser';
import {RamlDTSchemaParser} from '@asyncapi/raml-dt-schema-parser';
import {ProtoBuffSchemaParser} from '@asyncapi/protobuf-schema-parser';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {readFileSync} from 'fs';
import {InputAuthConfig, InputFilter, RunGeneratorContext} from '../../types';
import {Logger} from '../../../LoggingInterface';
import {createInputDocumentError} from '../../errors';
import {isRemoteUrl} from '../../../utils/inputSource';
import {fetchRemoteDocument} from '../../../utils/remoteFetch';
import {createAsyncapiResolvers} from '../../../utils/refResolvers';
import {isFilterActive} from '../../filter';
import {filterAsyncapiJson} from './filter';

const SHARED_PARSER_OPTIONS = {
  ruleset: {
    core: false,
    recommended: false
  },
  schemaParsers: [
    AvroSchemaParser(),
    OpenAPISchemaParser(),
    RamlDTSchemaParser(),
    ProtoBuffSchemaParser()
  ]
};

const sharedParser = new Parser({...SHARED_PARSER_OPTIONS});

function buildParserWithAuth(auth: InputAuthConfig, rootUrl: string): Parser {
  return new Parser({
    ...SHARED_PARSER_OPTIONS,
    __unstable: {
      resolver: {
        // The resolver shape comes from `@stoplight/spectral-ref-resolver`
        // and accepts `string | undefined | Promise<string | undefined>`.
        // Our resolver factory always returns a string.
        resolvers: createAsyncapiResolvers(auth, {rootUrl}) as any
      }
    }
  });
}

export async function loadAsyncapi(context: RunGeneratorContext) {
  return loadAsyncapiDocument({
    documentPath: context.documentPath,
    auth: context.inputAuth,
    filter: (context.configuration as {filter?: InputFilter}).filter
  });
}

/**
 * Apply the configured filter to a freshly parsed document. When the filter is
 * inactive the original document is returned untouched (the no-filter path stays
 * byte-identical). Otherwise the document JSON is filtered and re-parsed with the
 * same parser instance so downstream generators see the subsetted document.
 */
async function applyAsyncapiFilter({
  document,
  parser,
  filter,
  inputPath,
  source
}: {
  document: AsyncAPIDocumentInterface;
  parser: Parser;
  filter?: InputFilter;
  inputPath: string;
  source?: string;
}): Promise<AsyncAPIDocumentInterface> {
  if (!isFilterActive(filter)) {
    return document;
  }
  const filteredJson = filterAsyncapiJson({document, filter: filter!});
  const reparsed = await parser.parse(JSON.stringify(filteredJson), {
    source
  });
  if (!reparsed.document) {
    throw createInputDocumentError({
      inputPath,
      inputType: 'asyncapi',
      errorMessage: `Filtering produced an invalid document: ${JSON.stringify(
        reparsed.diagnostics,
        null,
        2
      )}`
    });
  }
  return reparsed.document;
}

export async function loadAsyncapiDocument({
  documentPath,
  auth,
  filter
}: {
  documentPath: string;
  auth?: InputAuthConfig;
  filter?: InputFilter;
}): Promise<AsyncAPIDocumentInterface | undefined> {
  Logger.verbose(`Loading AsyncAPI document from ${documentPath}`);
  let content: string;
  if (isRemoteUrl(documentPath)) {
    const fetched = await fetchRemoteDocument(documentPath, auth);
    content = fetched.content;
  } else {
    try {
      content = readFileSync(documentPath, 'utf-8');
    } catch (error) {
      throw createInputDocumentError({
        inputPath: documentPath,
        inputType: 'asyncapi',
        errorMessage: `Could not read file: ${error}`
      });
    }
  }

  const parser =
    isRemoteUrl(documentPath) && auth
      ? buildParserWithAuth(auth, documentPath)
      : sharedParser;

  const document = await parser.parse(content, {source: documentPath});
  if (document.diagnostics.length > 0) {
    throw createInputDocumentError({
      inputPath: documentPath,
      inputType: 'asyncapi',
      errorMessage: JSON.stringify(document.diagnostics, null, 2)
    });
  }
  Logger.debug(`AsyncAPI document loaded successfully`);
  return applyAsyncapiFilter({
    document: document.document!,
    parser,
    filter,
    inputPath: documentPath,
    source: documentPath
  });
}

export async function loadAsyncapiFromMemory({
  input,
  filter
}: {
  input: string;
  filter?: InputFilter;
}) {
  const document = await sharedParser.parse(input);
  if (document.diagnostics.length > 0) {
    throw createInputDocumentError({
      inputPath: 'memory',
      inputType: 'asyncapi',
      errorMessage: JSON.stringify(document.diagnostics, null, 2)
    });
  }

  return applyAsyncapiFilter({
    document: document.document!,
    parser: sharedParser,
    filter,
    inputPath: 'memory'
  });
}
