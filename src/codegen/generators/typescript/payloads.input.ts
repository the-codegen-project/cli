/**
 * Input contract for the TypeScript payloads generator.
 *
 * The payloads generator produces typed message/payload models from a
 * normalized JSON-Schema-shaped IR. The producer for each input type
 * (AsyncAPI, OpenAPI, EventCatalog) is responsible for translating
 * source-format specifics (message bindings, response status codes,
 * component schemas, etc.) into this shape.
 *
 * Built-in generators must consume `PayloadGeneratorInput` only; they
 * never reach back to the parsed source document.
 */

/**
 * A single payload schema entry: the JSON Schema and the schema's `$id`.
 * Used as values in the channel/operation maps and as elements in
 * `otherPayloads`.
 */
export interface PayloadEntry {
  /** JSON Schema document for this payload. */
  schema: unknown;
  /** Stable schema identifier used as `$id` and as a Modelina lookup key. */
  schemaId: string;
}

/**
 * Normalized payload data consumed by the TypeScript payloads generator.
 *
 * Maps:
 *   - `channelPayloads` — channel id → payload entry (channel-level message
 *     payloads; primarily AsyncAPI v2 channel.messages())
 *   - `operationPayloads` — operation id → payload entry (per-operation
 *     send/receive bodies; AsyncAPI operations and OpenAPI request/response
 *     payloads)
 *   - `otherPayloads` — additional schemas not tied to a channel/operation,
 *     such as OpenAPI `components.schemas` or AsyncAPI documents whose
 *     messages live outside any channel.
 */
export interface PayloadGeneratorInput {
  channelPayloads: Record<string, PayloadEntry | undefined>;
  operationPayloads: Record<string, PayloadEntry | undefined>;
  otherPayloads: PayloadEntry[];
}
