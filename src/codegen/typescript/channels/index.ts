import { ConstrainedMetaModel, ConstrainedObjectModel } from '@asyncapi/modelina';
import { GenericCodegenContext, GenericGeneratorOptions } from '../../types.js';
import { AsyncAPIDocumentInterface, ChannelInterface } from '@asyncapi/parser';
import { renderJetstreamFetch } from './protocols/nats/fetch.js';
import { writeFile } from 'fs/promises';
import path from 'path';
export type SupportedProtocols = "nats";
export interface TypeScriptChannelsGenerator extends GenericGeneratorOptions {
  preset: 'channels',
  outputPath: string,
  language?: 'typescript',
  payloadGeneratorId?: string,
  parameterGeneratorId?: string,
  protocols: SupportedProtocols[],
}

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGenerator = {
  preset: 'channels',
  language: 'typescript',
  outputPath: 'src/__gen__/channels',
  dependencies: ['parameters', 'payloads'],
  protocols: ['nats']
}

export interface TypeScriptChannelsContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	asyncapiDocument: AsyncAPIDocumentInterface,
  channelContext: Record<string, {
    payload: ConstrainedMetaModel,
    parameter: ConstrainedObjectModel
  }>,
	generator: TypeScriptChannelsGenerator
}

export async function generateTypeScriptChannels(context: TypeScriptChannelsContext) {
  const {asyncapiDocument, generator} = context;
  let codeToRender: string[] = []
  for (const channel of asyncapiDocument.allChannels().all()) {
    const protocolsToUse = generator.protocols;
    const {payload, parameter} = context.channelContext[channel.id()]

    for (const protocol of protocolsToUse) {
      const simpleContext = {topic: channel.address()!, channelParameters: parameter, message: payload, messageDescription: payload.originalInput.description}
      switch (protocol) {
        case 'nats':
          const renders = [
            renderJetstreamFetch(simpleContext)
          ];
          codeToRender = renders.map((value) => value.code)
          break;
      
        default:
          break;
      }
    }
  }
  await writeFile(path.resolve(context.generator.outputPath, 'index.ts'), codeToRender.join('\n'))
}