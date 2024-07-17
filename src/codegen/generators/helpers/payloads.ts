import {AsyncAPIInputProcessor, OutputModel} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {PayloadRenderType} from '../../types';

export async function generateAsyncAPIPayloads<GeneratorType>(
  asyncapiDocument: AsyncAPIDocumentInterface,
  generator: (input: any) => Promise<OutputModel[]>,
  generatorConfig: GeneratorType
): Promise<PayloadRenderType<GeneratorType>> {
  const returnType: Record<string, OutputModel> = {};
  for (const channel of asyncapiDocument.allChannels().all()) {
    let schemaObj: any = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema'
    };
    const messages = channel.messages().all();
    if (messages.length > 1) {
      schemaObj.oneOf = [];
      schemaObj['$id'] = `${channel.address()}Payload`;
      for (const message of messages) {
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.payload()!
        );
        if (typeof schema === 'boolean') {
          schemaObj.oneOf.push(schema);
        } else {
          schemaObj.oneOf.push({
            ...schema,
            $id: `${message.id()}`
          });
        }
      }
    } else {
      schemaObj = {
        ...schemaObj,
        ...messages[0].payload()?.json(),
        $id: `${messages[0].id()}`
      };
    }

    const models = await generator(schemaObj);
    returnType[channel.id()] = models[0];
  }
  return {
    channelModels: returnType,
    generator: generatorConfig
  };
}
