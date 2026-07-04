/**
 * EventCatalog producer for the TypeScript payloads generator.
 *
 * Composes the AsyncAPI / OpenAPI / native paths: when the service
 * declares an AsyncAPI spec we delegate to the AsyncAPI payloads
 * producer; when it declares an OpenAPI spec we delegate to the
 * OpenAPI one; native events become channel-keyed payload entries
 * directly (no synthetic AsyncAPI document required).
 *
 * Composition merges the channel/operation/other maps; same-keyed
 * entries from spec-based producers take precedence over native
 * entries (specs are more authoritative when both exist).
 */
import {
  PayloadEntry,
  PayloadGeneratorInput
} from '../../../generators/typescript/payloads.input';
import {ParsedEventCatalog} from '../parsedCatalog';
import {produceAsyncAPIPayloadInput} from '../../asyncapi/producers/payloads';
import {produceOpenAPIPayloadInput} from '../../openapi/producers/payloads';
import {nativeEventPayloadSchema, uniqueEvents} from './common';

export async function produceEventCatalogPayloadInput(
  catalog: ParsedEventCatalog
): Promise<PayloadGeneratorInput> {
  const channelPayloads: Record<string, PayloadEntry | undefined> = {};
  const operationPayloads: Record<string, PayloadEntry | undefined> = {};
  const otherPayloads: PayloadEntry[] = [];

  // Native events first, so spec-based producers can override on conflict.
  // Native channels synthesize one operation per event (see the channels
  // producer), and the channels generator looks payloads up by operation
  // id when `asyncapiGenerateForOperations` is enabled (the default), so
  // the same entry is registered under both the channel and operation id.
  for (const event of uniqueEvents([...catalog.sends, ...catalog.receives])) {
    const entry: PayloadEntry = {
      schema: nativeEventPayloadSchema(event),
      schemaId: event.id
    };
    channelPayloads[event.id] = entry;
    operationPayloads[event.id] = entry;
  }

  if (catalog.asyncapi) {
    const fromAsyncAPI = await produceAsyncAPIPayloadInput(catalog.asyncapi);
    Object.assign(channelPayloads, fromAsyncAPI.channelPayloads);
    Object.assign(operationPayloads, fromAsyncAPI.operationPayloads);
    otherPayloads.push(...fromAsyncAPI.otherPayloads);
  }
  if (catalog.openapi) {
    const fromOpenAPI = produceOpenAPIPayloadInput(catalog.openapi);
    Object.assign(channelPayloads, fromOpenAPI.channelPayloads);
    Object.assign(operationPayloads, fromOpenAPI.operationPayloads);
    otherPayloads.push(...fromOpenAPI.otherPayloads);
  }

  return {channelPayloads, operationPayloads, otherPayloads};
}
