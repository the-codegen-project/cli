/**
 * AsyncAPI producer for the TypeScript types generator.
 *
 * Extracts the address/id pairs the generator needs to render
 * `Topics`/`TopicIds`/helpers. Rendering happens in the generator
 * (see `generators/typescript/types.ts`).
 *
 * AsyncAPI 2.x has no separate channel-id concept distinct from the
 * address, so `emitIds` is false on v2 and the generator only emits
 * the `Topics` union.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {TypesGeneratorInput} from '../../../generators/typescript/types.input';

export function produceAsyncAPITypesInput(
  asyncapiDocument: AsyncAPIDocumentInterface
): TypesGeneratorInput {
  const allChannels = asyncapiDocument.allChannels().all();
  const addresses = allChannels.map((channel) => ({
    address: channel.address() ?? '',
    ids: [channel.id()]
  }));

  const emitIds = !asyncapiDocument.version().startsWith('2.');

  return {
    outputStyle: 'topics',
    emitIds,
    addresses
  };
}
