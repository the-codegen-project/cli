/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGenerator,
  TypeScriptChannelRenderType
} from '../channels';
import {generateNatsClient} from './protocols/nats';
import {generateHttpClient} from './protocols/http';
import {TheCodegenConfiguration, GeneratedFile} from '../../../types';
import {joinPath} from '../../../utils';
import {
  SupportedProtocols,
  TypeScriptClientContext,
  TypeScriptClientGenerator,
  TypeScriptClientRenderType,
  defaultTypeScriptClientGenerator,
  zodTypescriptClientGenerator,
  TypeScriptClientGeneratorInternal
} from './types';
import {createMissingInputDocumentError} from '../../../errors';

export {
  SupportedProtocols,
  TypeScriptClientContext,
  TypeScriptClientGenerator,
  TypeScriptClientRenderType,
  defaultTypeScriptClientGenerator,
  zodTypescriptClientGenerator,
  TypeScriptClientGeneratorInternal
};

/**
 * Whether the depended-on channels generator rendered any functions for the
 * given channel protocol key ('nats', 'http_client', ...).
 */
function hasRenderedFunctions(
  context: TypeScriptClientContext,
  channelProtocol: string
): boolean {
  const channels = context.dependencyOutputs?.[
    context.generator.channelsGeneratorId
  ] as TypeScriptChannelRenderType | undefined;
  return (channels?.renderedFunctions?.[channelProtocol]?.length ?? 0) > 0;
}

export async function generateTypeScriptClient(
  context: TypeScriptClientContext
): Promise<TypeScriptClientRenderType> {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw createMissingInputDocumentError({
      expectedType: 'asyncapi',
      generatorPreset: 'client'
    });
  }

  const renderedProtocols: Record<SupportedProtocols, string> = {
    nats: '',
    http: ''
  };
  const files: GeneratedFile[] = [];

  for (const protocol of generator.protocols) {
    switch (protocol) {
      case 'nats': {
        // Skip when the channels generator produced no NATS functions. The
        // config merge unions the default protocols with the user's, so an
        // HTTP-only client would otherwise emit an empty NatsClient.
        if (!hasRenderedFunctions(context, 'nats')) {
          break;
        }
        const renderedResult = await generateNatsClient(context);
        const filePath = joinPath(
          context.generator.outputPath,
          'NatsClient.ts'
        );
        files.push({path: filePath, content: renderedResult});
        renderedProtocols[protocol] = renderedResult;
        break;
      }
      case 'http': {
        if (!hasRenderedFunctions(context, 'http_client')) {
          break;
        }
        const {content, className} = await generateHttpClient(context);
        const filePath = joinPath(
          context.generator.outputPath,
          `${className}.ts`
        );
        files.push({path: filePath, content});
        renderedProtocols[protocol] = content;
        break;
      }
      default:
        break;
    }
  }
  return {
    protocolResult: renderedProtocols,
    files
  };
}

/**
 * Make sure we include all dependencies, if not added manually, is added to the generators.
 */
export function includeTypeScriptClientDependencies(
  config: TheCodegenConfiguration,
  generator: TypeScriptClientGenerator
) {
  const newGenerators: unknown[] = [];
  const channelsGeneratorId = generator.channelsGeneratorId;
  const hasChannelsGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === channelsGeneratorId
    ) !== undefined;
  if (!hasChannelsGenerator) {
    // The client protocol names map 1:1 to channel protocols except for HTTP,
    // where the client exposes 'http' but the channels generator expects
    // 'http_client'.
    const channelProtocols = generator.protocols?.map((protocol) =>
      protocol === 'http' ? 'http_client' : protocol
    );
    const defaultChannelPayloadGenerator: TypeScriptChannelsGenerator = {
      ...defaultTypeScriptChannelsGenerator,
      protocols: channelProtocols,
      outputPath: joinPath(generator.outputPath ?? '', './channels')
    };
    newGenerators.push(defaultChannelPayloadGenerator);
  }
  return newGenerators;
}
