import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {ProcessedHeadersData} from '../../../generators/typescript/headers';
import {pascalCase} from '../../../generators/typescript/utils';
import { AsyncAPIInputProcessor } from '@asyncapi/modelina';

// AsyncAPI input processor
export function processAsyncAPIHeaders(
  asyncapiDocument: AsyncAPIDocumentInterface
): ProcessedHeadersData {
  const channelHeaders: Record<
    string,
    | {
        schema: any;
        schemaId: string;
      }
    | undefined
  > = {};

  for (const channel of asyncapiDocument.allChannels().all()) {
    const messages = channel.messages().all();
    let hasHeadersInChannel = false;

    for (const message of messages) {
      if (message.hasHeaders()) {
        let schemaObj: any;
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.headers() as any
        );
        if (typeof schema === 'boolean') {
          schemaObj = schema;
        } else {
          schemaObj = {
            type: 'object',
            ...schema,
            $id: pascalCase(`${message.id()}_headers`),
            $schema: 'http://json-schema.org/draft-07/schema'
          };
        }

        channelHeaders[channel.id()] = {
          schema: schemaObj,
          schemaId: pascalCase(`${message.id()}_headers`)
        };
        hasHeadersInChannel = true;
        break; // Use first message with headers for the channel
      }
    }

    if (!hasHeadersInChannel) {
      channelHeaders[channel.id()] = undefined;
    }
  }

  return {channelHeaders};
}
