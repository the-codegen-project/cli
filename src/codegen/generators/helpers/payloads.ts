import {AsyncAPIInputProcessor, OutputModel} from '@asyncapi/modelina';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {PayloadRenderType} from '../../types';
import { pascalCase } from '../typescript/utils';
import { findNameFromChannel } from '../../utils';

// eslint-disable-next-line sonarjs/cognitive-complexity
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
      schemaObj['$id'] = pascalCase(`${findNameFromChannel(channel)}_Payload`);
      for (const message of messages) {
        const schema = AsyncAPIInputProcessor.convertToInternalSchema(
          message.payload()!
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
        messages[0].payload()!
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
    returnType[channel.id()] = models[0];
  }
  return {
    channelModels: returnType,
    generator: generatorConfig
  };
}
