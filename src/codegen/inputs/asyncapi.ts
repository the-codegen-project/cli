import AsyncapiParser from "@asyncapi/parser";

import { AvroSchemaParser } from '@asyncapi/avro-schema-parser';
import { OpenAPISchemaParser } from '@asyncapi/openapi-schema-parser';
import { RamlDTSchemaParser } from '@asyncapi/raml-dt-schema-parser';
import { ProtoBuffSchemaParser } from '@asyncapi/protobuf-schema-parser';
import { RunGeneratorContext } from "../types.js";

const parser = new AsyncapiParser.Parser({
	ruleset: {
		core: false,
		recommended: false
	},
	schemaParsers: [
		AvroSchemaParser(),
		OpenAPISchemaParser(),
		RamlDTSchemaParser(),
		ProtoBuffSchemaParser(),
	]
});

export async function loadAsyncapi(context: RunGeneratorContext) {
	const document = await AsyncapiParser.fromFile(parser, context.documentPath).parse()
	if(document.diagnostics.length > 0) {
        throw new Error(`Could not load AsyncAPI document, errors was: ${JSON.stringify(document.diagnostics)}`);
	}
	return document.document
}