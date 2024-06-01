import { GenericCodegenContext, GenericGeneratorOptions } from '../../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { renderJetstreamFetch } from './protocols/nats/fetch';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderJetstreamPublish } from './protocols/nats/jetstreamPublish';
import { renderJetstreamPullSubscribe } from './protocols/nats/pullSubscribe';
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
  protocols: ['nats'],
  id: 'channels-typescript'
};

export interface TypeScriptChannelsContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	asyncapiDocument?: AsyncAPIDocumentInterface,
	generator: TypeScriptChannelsGenerator
}

export async function generateTypeScriptChannels(context: TypeScriptChannelsContext) {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error("Expected AsyncAPI input, was not given");
  }

  const payloads = context.dependencyOutputs!['payload-typescript'];
  const parameters = context.dependencyOutputs!['parameters-typescript'];
  let codeToRender: string[] = [];
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const protocolsToUse = generator.protocols;
    const parameter = parameters[channel.id()];
    const payload = payloads[channel.id()];

    for (const protocol of protocolsToUse) {
      const simpleContext = {topic: channel.address()!, channelParameters: parameter, message: payload, messageDescription: payload.originalInput.description};
      switch (protocol) {
        case 'nats': {
          const renders = [
            renderJetstreamFetch(simpleContext),
            renderJetstreamPublish(simpleContext),
            renderJetstreamPullSubscribe(simpleContext)
          ];
          codeToRender = renders.map((value) => value.code);
          break;
        }
      
        default: {
          break;
        }
      }
    }
  }

  await writeFile(path.resolve(context.generator.outputPath, 'index.ts'), codeToRender.join('\n'));
}
