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

/**
 * Collect the ids of messages that are used *only* as reply messages. A
 * request/reply channel lists both its request and reply messages, but the
 * channel-level headers are consumed as the request headers — so reply-only
 * messages must not be folded into the channel header union (a request must
 * not carry the response's headers). A message used as both a request and a
 * reply somewhere is not treated as reply-only.
 */
function collectReplyOnlyMessageIds(
  asyncapiDocument: AsyncAPIDocumentInterface
): Set<string> {
  const requestIds = new Set<string>();
  const replyIds = new Set<string>();
  const idOf = (message: MessageInterface): string | undefined =>
    message.id() ?? message.name();
  for (const channel of asyncapiDocument.allChannels().all()) {
    for (const operation of channel.operations().all()) {
      for (const message of operation.messages().all()) {
        const id = idOf(message);
        if (id) {
          requestIds.add(id);
        }
      }
      const reply = operation.reply();
      if (reply) {
        for (const message of reply.messages().all()) {
          const id = idOf(message);
          if (id) {
            replyIds.add(id);
          }
        }
      }
    }
  }
  const replyOnly = new Set<string>();
  for (const id of replyIds) {
    if (!requestIds.has(id)) {
      replyOnly.add(id);
    }
  }
  return replyOnly;
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

  const replyOnlyMessageIds = collectReplyOnlyMessageIds(asyncapiDocument);

  for (const channel of asyncapiDocument.allChannels().all()) {
    // Exclude reply-only messages — the channel headers model the request side.
    const messages = channel
      .messages()
      .all()
      .filter(
        (message) =>
          !replyOnlyMessageIds.has(message.id() ?? message.name() ?? '')
      );
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
