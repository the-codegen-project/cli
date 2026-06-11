/**
 * Input contract for the TypeScript types generator.
 *
 * The types generator emits simple union/enum-shaped definitions
 * derived from channel/path metadata: a `Topics`/`Paths` string union,
 * an optional `TopicIds`/`OperationIds` union, plus helper functions
 * and a record map between them.
 *
 * Producers extract this shape from their source document; the
 * generator owns string-rendering and naming.
 */

/**
 * Naming flavor for the emitted unions and helpers.
 *
 * - `topics` — emits `Topics`, `TopicIds`, `ToTopicIds`, `ToTopics`,
 *   `TopicsMap` (AsyncAPI inputs).
 * - `paths` — emits `Paths`, `OperationIds`, `ToPath`, `ToOperationIds`,
 *   `PathsMap` (OpenAPI inputs).
 *
 * Producers select the flavor; the generator does not consult inputType.
 */
export type TypesOutputStyle = 'topics' | 'paths';

/**
 * A single channel/path entry. Multiple ids per address occur with
 * OpenAPI (one path can host get/post/...); AsyncAPI typically has a
 * single id per address.
 */
export interface TypesAddressEntry {
  /** Channel address (AsyncAPI) or path (OpenAPI). */
  address: string;
  /** Stable identifiers for this address (channel id or operation ids). */
  ids: string[];
}

/**
 * Normalized types data consumed by the TypeScript types generator.
 */
export interface TypesGeneratorInput {
  /** Naming style for emitted unions and helpers. */
  outputStyle: TypesOutputStyle;
  /**
   * Whether the ID-typed union (`TopicIds`/`OperationIds`) and its
   * helper functions should be emitted. False for AsyncAPI 2.x, which
   * historically only emits the address union.
   */
  emitIds: boolean;
  /** Address entries to render. */
  addresses: TypesAddressEntry[];
}
