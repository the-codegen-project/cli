/**
 * AsyncAPI producer for the TypeScript payloads generator.
 *
 * Walks an `AsyncAPIDocumentInterface` and emits a `PayloadGeneratorInput`
 * (per-channel, per-operation, and unattached "other" payload schemas).
 * The generator consumes the result without ever touching the AsyncAPI
 * document itself.
 */
/* eslint-disable security/detect-object-injection */
import {AsyncAPIInputProcessor} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface, MessageInterface} from '@asyncapi/parser';
import {pascalCase} from '../../../generators/typescript/utils';
import {
  findNameFromChannel,
  findOperationId,
  findReplyId,
  onlyUnique
} from '../../../utils';
import {
  PayloadEntry,
  PayloadGeneratorInput
} from '../../../generators/typescript/payloads.input';

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function produceAsyncAPIPayloadInput(
  asyncapiDocument: AsyncAPIDocumentInterface
): Promise<PayloadGeneratorInput> {
  const channelPayloads: Record<string, PayloadEntry> = {};
  const operationPayloads: Record<string, PayloadEntry> = {};
  const otherPayloads: PayloadEntry[] = [];

  const allChannels = asyncapiDocument.allChannels().all();
  const processMessages = (
    messagesToProcess: MessageInterface[],
    preId: string
  ): PayloadEntry | undefined => {
    let schemaObj: any = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema'
    };
    let id = preId;
    const messages = messagesToProcess;
    if (messages.length > 1) {
      schemaObj.oneOf = [];
      schemaObj['$id'] = pascalCase(`${preId}_Payload`);
      for (const message of messages) {
        if (!message.hasPayload()) {
          break;
        }
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.payload() as any
        );

        const payloadId = message.id() ?? message.name();
        if (typeof schema === 'boolean') {
          schemaObj.oneOf.push(schema);
        } else {
          const bindings = message.bindings();
          const statusCodesBindings = bindings?.get('http');
          const statusCodes = statusCodesBindings?.json()['statusCode'];
          if (statusCodesBindings && statusCodes) {
            schemaObj['x-modelina-has-status-codes'] = true;
            schema['x-modelina-status-codes'] = statusCodes;
          }
          schemaObj.oneOf.push({
            ...schema,
            $id: payloadId
          });
        }
      }
    } else if (messages.length === 1) {
      const message = messages[0];
      if (message.hasPayload()) {
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.payload() as any
        );
        if (typeof schema === 'boolean') {
          schemaObj = schema;
        } else {
          id =
            message.id() ??
            message.name() ??
            schema['x-modelgen-inferred-name'];
          if (id.includes('AnonymousSchema_')) {
            id = pascalCase(`${preId}_Payload`);
          }
          schemaObj = {
            ...schemaObj,
            ...(schema as any),
            $id: id
          };
        }
      } else {
        return;
      }
    } else {
      return;
    }

    return {
      schema: schemaObj,
      schemaId: id ?? schemaObj.$id ?? pascalCase(`${preId}_Payload`)
    };
  };

  if (allChannels.length > 0) {
    for (const channel of allChannels) {
      // Process operations
      for (const operation of channel.operations().all()) {
        const operationMessages = operation.messages().all();
        const operationReply = operation.reply();

        if (operationReply) {
          const operationReplyId = findReplyId(
            operation,
            operationReply,
            channel
          );
          const operationReplySchema = processMessages(
            operationReply.messages().all(),
            operationReplyId
          );
          if (operationReplySchema) {
            operationPayloads[operationReplyId] = operationReplySchema;
          }
        }

        const operationId = findOperationId(operation, channel);
        const operationSchema = processMessages(operationMessages, operationId);
        if (operationSchema) {
          operationPayloads[operationId] = operationSchema;
        }
      }

      // Process channel messages
      const channelSchema = processMessages(
        channel.messages().all(),
        findNameFromChannel(channel)
      );
      if (channelSchema) {
        channelPayloads[channel.id()] = channelSchema;
      }
    }
  } else {
    // Handle case where there are no channels but there might be components
    for (const message of asyncapiDocument.allMessages()) {
      const schemaId = message.id() ?? message.name();
      const schemaObj = processMessages([message], schemaId);
      if (schemaObj) {
        otherPayloads.push(schemaObj);
      }
    }
  }

  return {
    channelPayloads,
    operationPayloads,
    otherPayloads: onlyUnique(otherPayloads)
  };
}
