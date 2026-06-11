/**
 * Input contract for the custom generator.
 *
 * The custom generator is the documented exception that intentionally
 * exposes raw source documents to user-supplied render functions —
 * users may need format-specific details that the typed `{Generator}Input`
 * contracts don't surface. To keep the generator usable against any
 * input format (AsyncAPI, OpenAPI, JSON Schema, EventCatalog), the
 * `renderFunction` first arg is a strict superset of what other
 * generators consume:
 *
 *  - `inputs`        — typed `{Generator}Input` shapes for every built-in
 *                      generator. Use these when typed access is enough.
 *  - `rawDocuments`  — parsed source documents, including the EventCatalog
 *                      raw parse. Escape hatch for source-format details
 *                      not surfaced by `inputs`.
 *  - `inputType`     — the user-configured input type (never mutated).
 *  - `generator`     — the fully-resolved generator configuration.
 *  - `dependencyOutputs` — outputs of dependency generators.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {JsonSchemaDocument} from '../../inputs/jsonschema';
import {ParsedEventCatalog} from '../../inputs/eventcatalog/parsedCatalog';
import {PayloadGeneratorInput} from '../typescript/payloads.input';
import {ParameterGeneratorInput} from '../typescript/parameters.input';
import {HeadersGeneratorInput} from '../typescript/headers.input';
import {TypesGeneratorInput} from '../typescript/types.input';
import {ChannelGeneratorInput} from '../typescript/channels/input';
import {ClientGeneratorInput} from '../typescript/client/input';
import {ModelsGeneratorInput} from '../typescript/models.input';

/**
 * The input-type tag a user originally configured. The custom generator
 * sees the user-supplied value verbatim (never mutated, in contrast with
 * how the EventCatalog dispatch site used to overwrite `inputType`).
 */
export type CustomGeneratorInputType =
  | 'asyncapi'
  | 'openapi'
  | 'jsonschema'
  | 'eventcatalog';

/**
 * Source documents available to the user's render function. Each slot
 * is populated only when the corresponding source format is in use; the
 * EventCatalog slot is populated alongside `asyncapi` / `openapi` when
 * a service declares specs.
 */
export interface CustomGeneratorRawDocuments {
  asyncapi?: AsyncAPIDocumentInterface;
  openapi?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
  jsonSchema?: JsonSchemaDocument;
  eventCatalog?: ParsedEventCatalog;
}

/**
 * Typed inputs for every built-in generator, keyed by preset name.
 * Always populated (with empty-but-valid IRs when the source format
 * can't supply one — e.g. JSON Schema → `channels` is `{ channels: [] }`).
 */
export interface CustomGeneratorTypedInputs {
  payloads: PayloadGeneratorInput;
  parameters: ParameterGeneratorInput;
  headers: HeadersGeneratorInput;
  types: TypesGeneratorInput;
  channels: ChannelGeneratorInput;
  client: ClientGeneratorInput;
  models: ModelsGeneratorInput;
}

/**
 * The full first argument passed to the user's `renderFunction`.
 */
export interface CustomGeneratorInput {
  /** Typed inputs for every built-in generator. */
  inputs: CustomGeneratorTypedInputs;
  /** Raw parsed source documents (escape hatch). */
  rawDocuments: CustomGeneratorRawDocuments;
  /** The user-configured input type. */
  inputType: CustomGeneratorInputType;
  /** This custom generator's resolved configuration. */
  generator: unknown;
  /** Outputs of generators listed in `dependencies`. */
  dependencyOutputs: Record<string, unknown>;
}
