import {Parser, fromFile} from '@asyncapi/parser';
import {AvroSchemaParser} from '@asyncapi/avro-schema-parser';
import {OpenAPISchemaParser} from '@asyncapi/openapi-schema-parser';
import {RamlDTSchemaParser} from '@asyncapi/raml-dt-schema-parser';
import {ProtoBuffSchemaParser} from '@asyncapi/protobuf-schema-parser';
import {RunGeneratorContext} from '../../types';

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
	const document = await fromFile(parser, documentPath).parse();
	if (document.diagnostics.length > 0) {
    throw new Error(`Could not load AsyncAPI document, errors was: ${JSON.stringify(document.diagnostics)}`);
	}

	return document.document;
}

export async function loadAsyncapiFromMemory(input: string) {
	const document = await parser.parse(input);
	if (document.diagnostics.length > 0) {
    throw new Error(`Could not load AsyncAPI document, errors was: ${JSON.stringify(document.diagnostics)}`);
	}

	return document.document;
}
