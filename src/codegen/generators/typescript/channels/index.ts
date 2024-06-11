import { GenericCodegenContext, GenericGeneratorOptions } from '../../../types';
import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderJetstreamPublish } from './protocols/nats/jetstreamPublish';
import { renderJetstreamPullSubscribe } from './protocols/nats/pullSubscribe';
export type SupportedProtocols = "nats";
export interface TypeScriptChannelsGenerator extends GenericGeneratorOptions {
  preset: 'channels',
  outputPath: string,
  language?: 'typescript',
  /**
   * In case you have multiple TypeScript payload generators, you can specify which one to use as the dependency for this channels generator.
   */
  payloadGeneratorId?: string,
  /**
   * In case you have multiple TypeScript parameter generators, you can specify which one to use as the dependency for this channels generator.
   */
  parameterGeneratorId?: string,
  protocols: SupportedProtocols[],
}

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGenerator = {
  preset: 'channels',
  language: 'typescript',
  outputPath: 'src/__gen__/channels',
  // eslint-disable-next-line sonarjs/no-duplicate-string
  dependencies: ['parameters-typescript', 'payloads-typescript'],
  protocols: ['nats'],
  id: 'channels-typescript',
  parameterGeneratorId: 'parameters-typescript',
  payloadGeneratorId: 'payloads-typescript'
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
  if (!context.dependencyOutputs) {
    throw new Error("Internal error, could not determine previous rendered outputs that is required for channel typescript generator");
  }
  const payloads = context.dependencyOutputs['payloads-typescript'];
  const parameters = context.dependencyOutputs['parameters-typescript'];
  if (!payloads) {
    throw new Error("Internal error, could not determine previous rendered payloads generator that is required for channel typescript generator");
  }
  if (!parameters) {
    throw new Error("Internal error, could not determine previous rendered parameters generator that is required for channel typescript generator");
  }

  let codeToRender: string[] = [];
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const protocolsToUse = generator.protocols;
    const parameter = parameters.channelModels[channel.id()];
    if (parameter === undefined) {
      throw new Error(`Could not find parameter for ${channel.id()} for channel typescript generator`);
    }
    const payload = payloads.channelModels[channel.id()];
    if (payload === undefined) {
      throw new Error(`Could not find payload for ${channel.id()} for channel typescript generator`);
    }

    for (const protocol of protocolsToUse) {
      const simpleContext = {topic: channel.address()!, channelParameters: parameter.model, message: payload.model, };
      switch (protocol) {
        case 'nats': {
          const renders = [
            //renderJetstreamFetch(simpleContext),
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
  await mkdir(context.generator.outputPath, { recursive: true });
  await writeFile(path.resolve(context.generator.outputPath, 'index.ts'), codeToRender.join('\n\n'), {});
}
