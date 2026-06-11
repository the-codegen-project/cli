/**
 * EventCatalog producer for the TypeScript headers generator.
 *
 * Native events don't carry headers — only AsyncAPI / OpenAPI
 * specs supply them. Native events still need a key in the
 * resulting `channelHeaders` map (with `undefined` value) so the
 * channels generator's per-channel header lookup doesn't fall
 * through to a generic-but-misleading "missing header" path.
 */
import {
  HeadersEntry,
  HeadersGeneratorInput
} from '../../../generators/typescript/headers.input';
import {ParsedEventCatalog} from '../parsedCatalog';
import {produceAsyncAPIHeadersInput} from '../../asyncapi/producers/headers';
import {produceOpenAPIHeadersInput} from '../../openapi/producers/headers';
import {uniqueEvents} from './common';

export function produceEventCatalogHeadersInput(
  catalog: ParsedEventCatalog
): HeadersGeneratorInput {
  const channelHeaders: Record<string, HeadersEntry | undefined> = {};

  // Reserve keys for native events with `undefined` values.
  for (const event of uniqueEvents([...catalog.sends, ...catalog.receives])) {
    channelHeaders[event.id] = undefined;
  }

  if (catalog.asyncapi) {
    const fromAsyncAPI = produceAsyncAPIHeadersInput(catalog.asyncapi);
    Object.assign(channelHeaders, fromAsyncAPI.channelHeaders);
  }
  if (catalog.openapi) {
    const fromOpenAPI = produceOpenAPIHeadersInput(catalog.openapi);
    Object.assign(channelHeaders, fromOpenAPI.channelHeaders);
  }

  return {channelHeaders};
}
