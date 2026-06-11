/**
 * Input contract for the TypeScript parameters generator.
 *
 * The parameters generator produces typed parameter models used to
 * interpolate values into channel addresses (AsyncAPI subjects/topics)
 * or HTTP URL templates (OpenAPI paths and query strings).
 *
 * The producer is responsible for emitting JSON Schemas with the
 * appropriate Modelina extensions baked in (e.g. `x-parameter-location`,
 * `x-channel-address`). The generator picks a Modelina additionalContent
 * preset based on `serializationStyle`; it never inspects `inputType`.
 */

/**
 * The kind of consumer-side rendering this parameter model needs.
 *
 * - `channel-address` — interpolate `{paramName}` placeholders into a
 *   subject/topic string (AsyncAPI). The generator emits
 *   `getChannelWithParameters` and `createFromChannel`.
 * - `http-url` — serialize/deserialize as OpenAPI path+query params with
 *   style/explode/allowReserved semantics. The generator emits
 *   `serializeUrl`, `deserializeUrl`, `fromUrl`.
 */
export type ParameterSerializationStyle = 'channel-address' | 'http-url';

/**
 * A single parameter-model schema entry plus the rendering style the
 * generator should apply when emitting additional methods on the model.
 */
export interface ParameterEntry {
  /** JSON Schema document for the parameter object (with x-parameter-* extensions). */
  schema: unknown;
  /** Stable schema identifier used as `$id` and as a Modelina lookup key. */
  schemaId: string;
  /** Which family of additional methods the generator should emit on the model. */
  serializationStyle: ParameterSerializationStyle;
}

/**
 * Normalized parameter data consumed by the TypeScript parameters generator.
 *
 * `channelParameters` maps a channel id (AsyncAPI) or operation id
 * (OpenAPI) to its parameter entry. Keys with `undefined` values
 * indicate channels/operations that explicitly have no parameters
 * (the generator skips them but keeps the key for downstream lookups).
 */
export interface ParameterGeneratorInput {
  channelParameters: Record<string, ParameterEntry | undefined>;
}
