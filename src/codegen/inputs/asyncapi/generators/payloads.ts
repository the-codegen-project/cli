/* eslint-disable security/detect-object-injection */
import {
  AsyncAPIInputProcessor
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface, MessageInterface} from '@asyncapi/parser';
import {pascalCase} from '../../../generators/typescript/utils';
import {findNameFromChannel, findOperationId, findReplyId, onlyUnique} from '../../../utils';

// Interface for processed payload schema data
export interface ProcessedPayloadSchemaData {
  channelPayloads: Record<string, {schema: any; schemaId: string}>;
  operationPayloads: Record<string, {schema: any; schemaId: string}>;
  otherPayloads: {schema: any; schemaId: string}[];
}
const processor = new AsyncAPIInputProcessor();
// AsyncAPI input processor
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function processAsyncAPIPayloads(
  asyncapiDocument: AsyncAPIDocumentInterface
): Promise<ProcessedPayloadSchemaData> {
  const channelPayloads: Record<string, {schema: any; schemaId: string}> = {};
  const operationPayloads: Record<string, {schema: any; schemaId: string}> = {};
  const otherPayloads: {schema: any; schemaId: string}[] = [];
  const processMessages = (
    messagesToProcess: MessageInterface[],
    preId: string
  ): {schema: any; schemaId: string} | undefined => {
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
          id = message.id() ?? message.name() ?? schema['x-modelgen-inferred-name'];
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

  if (asyncapiDocument.allChannels().all().length > 0) {
    for (const channel of asyncapiDocument.allChannels().all()) {
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
        const operationSchema = processMessages(
          operationMessages,
          operationId
        );
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
