import {
  AsyncAPIInputProcessor,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {ChannelPayload, PayloadRenderType} from '../../types';
import {pascalCase} from '../typescript/utils';
import {findNameFromChannel} from '../../utils';
type ChannelReturnType = Record<
  string,
  {messageModel: OutputModel; messageType: string}
>;
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateAsyncAPIPayloads<GeneratorType>(
  asyncapiDocument: AsyncAPIDocumentInterface,
  generator: (input: any) => Promise<OutputModel[]>,
  generatorConfig: GeneratorType
): Promise<PayloadRenderType<GeneratorType>> {
  const channelReturnType: ChannelReturnType = {};
  let otherModels: ChannelPayload[] = [];
  if (asyncapiDocument.allChannels().all().length > 0) {
    for (const channel of asyncapiDocument.allChannels().all()) {
      let schemaObj: any = {
        type: 'object',
        $schema: 'http://json-schema.org/draft-07/schema'
      };
      const replyMessages = channel.messages().all();
      const messages = channel.messages().all();
      if (messages.length > 1) {
        schemaObj.oneOf = [];
        schemaObj['$id'] = pascalCase(
          `${findNameFromChannel(channel)}_Payload`
        );
        for (const message of messages) {
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
        const messagePayload = messages[0].payload();
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          messagePayload as any
        );
        const message = messages[0];
        let payloadId = message.id() ?? message.name();
        if (payloadId.includes('AnonymousSchema_')) {
          payloadId = pascalCase(`${findNameFromChannel(channel)}_Payload`);
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
        continue;
      }
      const models = await generator(schemaObj);
      const messageModel = models[0].model;
      let messageType = messageModel.type;
      // Workaround from Modelina as rendering root payload model can create simple types and `.type` is no longer valid for what we use it for
      if (!(messageModel instanceof ConstrainedObjectModel)) {
        messageType = messageModel.name;
      }
      channelReturnType[channel.id()] = {
        messageModel: models[0],
        messageType
      };
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
    channelModels: channelReturnType,
    otherModels,
    generator: generatorConfig
  };
}
