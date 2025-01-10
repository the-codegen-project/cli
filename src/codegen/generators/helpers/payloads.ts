/* eslint-disable security/detect-object-injection */
import {
  AsyncAPIInputProcessor,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {
  AsyncAPIDocumentInterface,
  ChannelInterface,
  MessageInterface,
  OperationInterface,
  OperationReplyInterface
} from '@asyncapi/parser';
import {ChannelPayload, PayloadRenderType} from '../../types';
import {pascalCase} from '../typescript/utils';
import {findExtensionObject, findNameFromChannel} from '../../utils';
type PayloadGenerationType = Record<
  string,
  {messageModel: OutputModel; messageType: string}
>;
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateAsyncAPIPayloads<GeneratorType>(
  asyncapiDocument: AsyncAPIDocumentInterface,
  generator: (input: any) => Promise<OutputModel[]>,
  generatorConfig: GeneratorType
): Promise<PayloadRenderType<GeneratorType>> {
  const generatedChannelPayloads: PayloadGenerationType = {};
  const generatedOperationPayloads: PayloadGenerationType = {};
  let otherModels: ChannelPayload[] = [];
  if (asyncapiDocument.allChannels().all().length > 0) {
    for (const channel of asyncapiDocument.allChannels().all()) {
      const processMessages = async (
        messagesToProcess: MessageInterface[],
        preId: string
      ): Promise<
        {generatedMessages: any[]; messageType: string} | undefined
      > => {
        let schemaObj: any = {
          type: 'object',
          $schema: 'http://json-schema.org/draft-07/schema'
        };
        const messages = messagesToProcess;
        if (messages.length > 1) {
          schemaObj.oneOf = [];
          schemaObj['$id'] = pascalCase(`${preId}_Payload`);
          for (const message of messages) {
            if (message.hasPayload()) {
              break;
            }
            const schema = AsyncAPIInputProcessor.convertToInternalSchema(
              message.payload() as any
            );
            const payloadId = message.id() ?? message.name();
            if (typeof schema === 'boolean') {
              schemaObj.oneOf.push(schema);
            } else {
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
            let payloadId = message.id() ?? message.name();
            if (payloadId.includes('AnonymousSchema_')) {
              payloadId = pascalCase(`${preId}_Payload`);
            }
            if (typeof schema === 'boolean') {
              schemaObj = schema;
            } else {
              schemaObj = {
                ...schemaObj,
                ...(schema as any),
                $id: payloadId
              };
            }
          } else {
            return;
          }
        } else {
          return;
        }
        const models = await generator(schemaObj);
        const messageModel = models[0].model;
        let messageType = messageModel.type;
        // Workaround from Modelina as rendering root payload model can create simple types and `.type` is no longer valid for what we use it for
        if (!(messageModel instanceof ConstrainedObjectModel)) {
          messageType = messageModel.name;
        }
        return {generatedMessages: models, messageType};
      };
      for (const operation of channel.operations().all()) {
        //const operationMessages = operation.messages().all().filter((message) => message.id() !== undefined);
        const operationMessages = operation.messages().all();
        const operationReply = operation.reply();
        if (operationReply) {
          const operationReplyId = findReplyId(
            operation,
            operationReply,
            channel
          );
          const operationReplyGeneratedMessages = await processMessages(
            operationReply.messages().all(),
            operationReplyId
          );
          if (operationReplyGeneratedMessages) {
            generatedOperationPayloads[operationReplyId] = {
              messageModel:
                operationReplyGeneratedMessages.generatedMessages[0],
              messageType: operationReplyGeneratedMessages.messageType
            };
          }
        }
        const operationId = findOperationId(operation, channel);
        const operationGeneratedMessages = await processMessages(
          operationMessages,
          operationId
        );
        if (operationGeneratedMessages) {
          generatedOperationPayloads[operationId] = {
            messageModel: operationGeneratedMessages.generatedMessages[0],
            messageType: operationGeneratedMessages.messageType
          };
        }
      }
      const channelGeneratedMessages = await processMessages(
        channel.messages().all(),
        findNameFromChannel(channel)
      );
      if (channelGeneratedMessages) {
        generatedChannelPayloads[channel.id()] = {
          messageModel: channelGeneratedMessages.generatedMessages[0],
          messageType: channelGeneratedMessages.messageType
        };
      }
    }
  } else {
    const generatedModels = await generator(asyncapiDocument);

    otherModels = generatedModels.map((model) => {
      return {
        messageModel: model,
        messageType: model.model.type
      };
    });
  }
  return {
    channelModels: generatedChannelPayloads,
    operationModels: generatedOperationPayloads,
    otherModels,
    generator: generatorConfig
  };
}

export function findReplyId(
  operation: OperationInterface,
  reply: OperationReplyInterface,
  channel: ChannelInterface
) {
  return (
    `${findOperationId(operation, reply.channel() ?? channel)}_reply`
  );
}
export function findOperationId(
  operation: OperationInterface,
  channel: ChannelInterface
) {
  let operationId = operation.id();
  operationId = operation.hasOperationId()
    ? operation.operationId()
    : operationId;
  const userSpecificName = findExtensionObject(operation)
    ? findExtensionObject(operation)['channelName']
    : undefined;
  if (userSpecificName) {
    return userSpecificName;
  }
  return operationId ?? channel.id();
}
