import {AsyncAPIDocumentInterface, MessageInterface} from '@asyncapi/parser';
import {ProcessedHeadersData} from '../../../generators/typescript/headers';
import {pascalCase} from '../../../generators/typescript/utils';
import {findNameFromChannel} from '../../../utils';
import {Logger} from '../../../../LoggingInterface';
import {AsyncAPIInputProcessor} from '@asyncapi/modelina';

/**
 * Convert a single message's headers into an internal JSON Schema. Mirrors the
 * shape used for single-message channels so union members and standalone
 * headers stay identical.
 */
function convertMessageHeaders(message: MessageInterface): any {
  const schema = AsyncAPIInputProcessor.convertToInternalSchema(
    message.headers() as any
  );
  if (typeof schema === 'boolean') {
    return schema;
  }
  return {
    type: 'object',
    ...schema,
    $id: pascalCase(`${message.id()}_headers`),
    $schema: 'http://json-schema.org/draft-07/schema'
  };
}

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
    const headerBearingMessages = messages.filter((message) =>
      message.hasHeaders()
    );

    if (headerBearingMessages.length === 0) {
      channelHeaders[channel.id()] = undefined;
      continue;
    }

    // Warn (rather than silently drop) about header-less messages that sit
    // alongside header-bearing ones — they are left out of the headers union.
    for (const message of messages) {
      if (!message.hasHeaders()) {
        Logger.warn(
          `Message '${message.id() ?? message.name()}' in '${findNameFromChannel(channel)}' has no headers and was skipped from the headers union`
        );
      }
    }

    if (headerBearingMessages.length > 1) {
      // 2+ header-bearing messages → a oneOf union, mirroring the payloads
      // union builder (channel-scoped union id).
      const unionId = pascalCase(`${findNameFromChannel(channel)}_Headers`);
      channelHeaders[channel.id()] = {
        schema: {
          type: 'object',
          $id: unionId,
          $schema: 'http://json-schema.org/draft-07/schema',
          oneOf: headerBearingMessages.map((message) =>
            convertMessageHeaders(message)
          )
        },
        schemaId: unionId
      };
    } else {
      // Exactly one header-bearing message → unchanged single-message output.
      const message = headerBearingMessages[0];
      channelHeaders[channel.id()] = {
        schema: convertMessageHeaders(message),
        schemaId: pascalCase(`${message.id()}_headers`)
      };
    }
  }

  return {channelHeaders};
}
