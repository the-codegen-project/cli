import {
  AsyncAPIInputProcessor,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {PayloadRenderType} from '../../types';
import {pascalCase} from '../typescript/utils';
import {findNameFromChannel} from '../../utils';
type returnType = Record<
  string,
  {messageModel: OutputModel; messageType: string}
>;
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateAsyncAPIPayloads<GeneratorType>(
  asyncapiDocument: AsyncAPIDocumentInterface,
  generator: (input: any) => Promise<OutputModel[]>,
  generatorConfig: GeneratorType
): Promise<PayloadRenderType<GeneratorType>> {
  const returnType: returnType = {};
  for (const channel of asyncapiDocument.allChannels().all()) {
    let schemaObj: any = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema'
    };
    const replyMessages = channel.messages().all();
    const messages = channel.messages().all();
    if (messages.length > 1) {
      schemaObj.oneOf = [];
      schemaObj['$id'] = pascalCase(`${findNameFromChannel(channel)}_Payload`);
      for (const message of messages) {
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.payload() as any
        );
        if (typeof schema === 'boolean') {
          schemaObj.oneOf.push(schema);
        } else {
          schemaObj.oneOf.push({
            ...schema,
            'x-modelgen-inferred-name': `${message.id()}`
          });
        }
      }
    } else if (messages.length === 1) {
      const schema = AsyncAPIInputProcessor.convertToInternalSchema(
        messages[0].payload() as any
      );

      if (typeof schema === 'boolean') {
        schemaObj = schema;
      } else {
        schemaObj = {
          ...schemaObj,
          ...(schema as any),
          $id: `${messages[0].payload()?.id()}`
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
    returnType[channel.id()] = {
      messageModel: models[0],
      messageType
    };
  }
  return {
    channelModels: returnType,
    generator: generatorConfig
  };
}
