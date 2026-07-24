import {
  AsyncAPIDocumentInterface,
  ChannelInterface,
  MessageInterface
} from '@asyncapi/parser';
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
function addMessageIds(
  messages: MessageInterface[],
  target: Set<string>
): void {
  for (const message of messages) {
    const id = message.id() ?? message.name();
    if (id) {
      target.add(id);
    }
  }
}

function collectReplyOnlyMessageIds(
  asyncapiDocument: AsyncAPIDocumentInterface
): Set<string> {
  const requestIds = new Set<string>();
  const replyIds = new Set<string>();
  for (const channel of asyncapiDocument.allChannels().all()) {
    for (const operation of channel.operations().all()) {
      addMessageIds(operation.messages().all(), requestIds);
      const reply = operation.reply();
      if (reply) {
        addMessageIds(reply.messages().all(), replyIds);
      }
    }
  }
  return new Set([...replyIds].filter((id) => !requestIds.has(id)));
}

/**
 * Build the header entry for a single channel: `undefined` when no (non-reply)
 * message has headers, the single message's headers when exactly one does, or a
 * channel-scoped `oneOf` union when two or more do. Header-less messages that
 * sit alongside header-bearing ones are warned about.
 */
function buildChannelHeaderEntry(
  channel: ChannelInterface,
  replyOnlyMessageIds: Set<string>
): {schema: any; schemaId: string} | undefined {
  // Exclude reply-only messages — the channel headers model the request side.
  const messages = channel
    .messages()
    .all()
    .filter(
      (message) => !replyOnlyMessageIds.has(message.id() ?? message.name() ?? '')
    );
  const headerBearingMessages = messages.filter((message) =>
    message.hasHeaders()
  );

  if (headerBearingMessages.length === 0) {
    return undefined;
  }

  for (const message of messages) {
    if (!message.hasHeaders()) {
      Logger.warn(
        `Message '${message.id() ?? message.name()}' in '${findNameFromChannel(channel)}' has no headers and was skipped from the headers union`
      );
    }
  }

  if (headerBearingMessages.length === 1) {
    // Exactly one header-bearing message → unchanged single-message output.
    const message = headerBearingMessages[0];
    return {
      schema: convertMessageHeaders(message),
      schemaId: pascalCase(`${message.id()}_headers`)
    };
  }

  // 2+ header-bearing messages → a oneOf union, mirroring the payloads union
  // builder (channel-scoped union id).
  const unionId = pascalCase(`${findNameFromChannel(channel)}_Headers`);
  return {
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
    channelHeaders[channel.id()] = buildChannelHeaderEntry(
      channel,
      replyOnlyMessageIds
    );
  }

  return {channelHeaders};
}
