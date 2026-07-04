/**
 * EventCatalog producer for the models generator.
 *
 * `ModelsGeneratorInput` is a typed envelope (decision 11), so we
 * populate whichever slots the service has data for. Native event
 * schemas are delivered via the `jsonSchema` slot — Modelina handles
 * each event's JSON Schema independently. When multiple specs are
 * declared the producer populates multiple slots; the generator
 * iterates whatever is present.
 *
 * Note: since `ModelsGeneratorInput.jsonSchema` is a single document,
 * we coalesce native event schemas into a `definitions`-shaped wrapper
 * when there's more than one. Modelina enumerates `definitions` so all
 * events become emitted models.
 */
import {ModelsGeneratorInput} from '../../../generators/typescript/models.input';
import {ParsedEventCatalog} from '../parsedCatalog';
import {nativeEventPayloadSchema, uniqueEvents} from './common';

export function produceEventCatalogModelsInput(
  catalog: ParsedEventCatalog
): ModelsGeneratorInput {
  const result: ModelsGeneratorInput = {};

  if (catalog.asyncapi) {
    result.asyncapi = catalog.asyncapi;
  }
  if (catalog.openapi) {
    result.openapi = catalog.openapi;
  }

  const nativeEvents = uniqueEvents([...catalog.sends, ...catalog.receives]);
  if (nativeEvents.length > 0) {
    if (nativeEvents.length === 1) {
      // Use the same `$id`-normalized schema as the payloads producer so
      // Modelina names the model after the event id consistently across
      // the models and payloads generators (rather than an anonymous
      // fallback name when the raw schema has no `$id`/`title`).
      result.jsonSchema = nativeEventPayloadSchema(
        nativeEvents[0]
      ) as ModelsGeneratorInput['jsonSchema'];
    } else {
      // Aggregate multiple events into a single document under
      // `definitions` so Modelina enumerates them all.
      const definitions: Record<string, unknown> = {};
      for (const event of nativeEvents) {
        definitions[event.id] = nativeEventPayloadSchema(event);
      }
      result.jsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema',
        definitions
      };
    }
  }

  return result;
}
