/**
 * Input contract for the TypeScript headers generator.
 *
 * The headers generator produces typed message-header models. Producers
 * extract header schemas from the source document (AsyncAPI message
 * headers, OpenAPI parameters with `in: header`) and emit a normalized
 * channel-id-keyed map.
 */

/**
 * A single header-model schema entry.
 */
export interface HeadersEntry {
  /** JSON Schema document for the header object. */
  schema: unknown;
  /** Stable schema identifier used as `$id` and as a Modelina lookup key. */
  schemaId: string;
}

/**
 * Normalized header data consumed by the TypeScript headers generator.
 *
 * Keys are channel ids (AsyncAPI) or operation ids (OpenAPI). An
 * `undefined` value indicates the channel/operation is known but has no
 * headers; the generator preserves the key for downstream lookups.
 */
export interface HeadersGeneratorInput {
  channelHeaders: Record<string, HeadersEntry | undefined>;
}
