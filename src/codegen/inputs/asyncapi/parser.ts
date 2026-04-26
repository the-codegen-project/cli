import {Parser} from '@asyncapi/parser';
import {AvroSchemaParser} from '@asyncapi/avro-schema-parser';
import {OpenAPISchemaParser} from '@asyncapi/openapi-schema-parser';
import {RamlDTSchemaParser} from '@asyncapi/raml-dt-schema-parser';
import {ProtoBuffSchemaParser} from '@asyncapi/protobuf-schema-parser';
import {readFileSync} from 'fs';
import {InputAuthConfig, RunGeneratorContext} from '../../types';
import {Logger} from '../../../LoggingInterface';
import {createInputDocumentError} from '../../errors';
import {isRemoteUrl} from '../../../utils/inputSource';
import {fetchRemoteDocument} from '../../../utils/remoteFetch';
import {createAsyncapiResolvers} from '../../../utils/refResolvers';

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
  return loadAsyncapiDocument(context.documentPath, context.inputAuth);
}

export async function loadAsyncapiDocument(
  documentPath: string,
  auth?: InputAuthConfig
) {
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
  return document.document;
}

export async function loadAsyncapiFromMemory(input: string) {
  const document = await sharedParser.parse(input);
  if (document.diagnostics.length > 0) {
    throw createInputDocumentError({
      inputPath: 'memory',
      inputType: 'asyncapi',
      errorMessage: JSON.stringify(document.diagnostics, null, 2)
    });
  }

  return document.document;
}
