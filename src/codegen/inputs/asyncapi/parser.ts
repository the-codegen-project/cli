import {Parser, fromFile} from '@asyncapi/parser';
import {AvroSchemaParser} from '@asyncapi/avro-schema-parser';
import {OpenAPISchemaParser} from '@asyncapi/openapi-schema-parser';
import {RamlDTSchemaParser} from '@asyncapi/raml-dt-schema-parser';
import {ProtoBuffSchemaParser} from '@asyncapi/protobuf-schema-parser';
import {RunGeneratorContext} from '../../types';
import {Logger} from '../../../LoggingInterface';
import {createInputDocumentError} from '../../errors';

const parser = new Parser({
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
});

export async function loadAsyncapi(context: RunGeneratorContext) {
  return loadAsyncapiDocument(context.documentPath);
}

export async function loadAsyncapiDocument(documentPath: string) {
  Logger.verbose(`Loading AsyncAPI document from ${documentPath}`);
  const document = await fromFile(parser, documentPath).parse();
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
  const document = await parser.parse(input);
  if (document.diagnostics.length > 0) {
    throw createInputDocumentError({
      inputPath: 'memory',
      inputType: 'asyncapi',
      errorMessage: JSON.stringify(document.diagnostics, null, 2)
    });
  }

  return document.document;
}
