/**
 * Shared helpers for EventCatalog producers.
 *
 * Native EventCatalog events have a flat structure: each event is a
 * single JSON Schema scoped under `events/<id>/`. The producers
 * translate that into the typed `{Generator}Input` shapes used by
 * built-in generators. Same-id events are deduplicated so an event
 * that appears in both `sends` and `receives` is emitted exactly once
 * in the payload/channel maps.
 */
import {ParsedEventCatalogEvent} from '../parsedCatalog';

/**
 * Build a JSON Schema entry for a native event payload. We add `$id`
 * and `$schema` to mirror what the AsyncAPI/OpenAPI producers do, so
 * Modelina sees a consistent schema shape across input formats.
 */
export function nativeEventPayloadSchema(
  event: ParsedEventCatalogEvent
): unknown {
  return {
    ...(event.schema as Record<string, unknown>),
    $id: event.id,
    $schema: 'http://json-schema.org/draft-07/schema'
  };
}

/**
 * Deduplicate events by id, preserving order. Returns the first
 * occurrence of each event id.
 */
export function uniqueEvents(
  events: ParsedEventCatalogEvent[]
): ParsedEventCatalogEvent[] {
  const seen = new Set<string>();
  const result: ParsedEventCatalogEvent[] = [];
  for (const event of events) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      result.push(event);
    }
  }
  return result;
}
