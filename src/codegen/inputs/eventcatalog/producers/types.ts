/**
 * EventCatalog producer for the TypeScript types generator.
 *
 * The types generator emits a single output style (`topics` or `paths`).
 * For an EventCatalog service we pick `topics` (matches AsyncAPI
 * naming) and pull addresses from whichever underlying source(s) are
 * present:
 *   - native events → address = event id
 *   - AsyncAPI spec → use AsyncAPI types producer's addresses
 *   - OpenAPI spec  → use the OpenAPI addresses but project them
 *     under the `topics` flavor (so we always emit `Topics` rather
 *     than mixing `Topics` and `Paths` in one file).
 */
import {TypesGeneratorInput} from '../../../generators/typescript/types.input';
import {ParsedEventCatalog} from '../parsedCatalog';
import {produceAsyncAPITypesInput} from '../../asyncapi/producers/types';
import {produceOpenAPITypesInput} from '../../openapi/producers/types';
import {uniqueEvents} from './common';

export function produceEventCatalogTypesInput(
  catalog: ParsedEventCatalog
): TypesGeneratorInput {
  const addresses: TypesGeneratorInput['addresses'] = [];
  let emitIds = false;

  for (const event of uniqueEvents([...catalog.sends, ...catalog.receives])) {
    addresses.push({address: event.id, ids: [event.id]});
    emitIds = true;
  }

  if (catalog.asyncapi) {
    const fromAsyncAPI = produceAsyncAPITypesInput(catalog.asyncapi);
    addresses.push(...fromAsyncAPI.addresses);
    emitIds = emitIds || fromAsyncAPI.emitIds;
  }
  if (catalog.openapi) {
    const fromOpenAPI = produceOpenAPITypesInput(catalog.openapi);
    addresses.push(...fromOpenAPI.addresses);
    emitIds = emitIds || fromOpenAPI.emitIds;
  }

  return {
    outputStyle: 'topics',
    emitIds,
    addresses
  };
}
