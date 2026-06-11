/**
 * Input contract for the TypeScript models generator.
 *
 * The models generator is one of two documented exceptions (alongside
 * `custom`) where the input contract is a typed envelope over source
 * documents rather than a normalized IR. The reason is **scope**:
 * `models` operates on every schema in the document
 * (components.schemas, message payloads, parameter schemas, etc.) and
 * Modelina IS the extractor. Re-implementing those walkers in
 * producers would duplicate effort and silently produce different
 * model coverage.
 *
 * Producers populate the appropriate slot for the input type they
 * service (the AsyncAPI producer fills `asyncapi`; the OpenAPI
 * producer fills `openapi`; etc.). The generator passes whatever
 * is present to Modelina.
 *
 * The principle is preserved in spirit: the generator does not see
 * `inputType`, does not see bindings, does not see EventCatalog raw
 * structure — only what Modelina consumes natively.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {JsonSchemaDocument} from '../../inputs/jsonschema';

/**
 * Typed envelope over the source document(s) that the models generator
 * feeds to Modelina. Producers fill the slot that matches their input
 * type; an EventCatalog producer may populate multiple slots when the
 * service declares both AsyncAPI and OpenAPI specs.
 */
export interface ModelsGeneratorInput {
  asyncapi?: AsyncAPIDocumentInterface;
  openapi?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
  jsonSchema?: JsonSchemaDocument;
}
