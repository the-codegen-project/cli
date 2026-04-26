/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGenerator
} from '../channels';
import {generateNatsClient} from './protocols/nats';
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
    nats: ''
  };
  const files: GeneratedFile[] = [];

  for (const protocol of generator.protocols) {
    switch (protocol) {
      case 'nats': {
        const renderedResult = await generateNatsClient(context);
        const filePath = joinPath(
          context.generator.outputPath,
          'NatsClient.ts'
        );
        files.push({path: filePath, content: renderedResult});
        renderedProtocols[protocol] = renderedResult;
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
    const defaultChannelPayloadGenerator: TypeScriptChannelsGenerator = {
      ...defaultTypeScriptChannelsGenerator,
      protocols: generator.protocols,
      outputPath: joinPath(generator.outputPath ?? '', './channels')
    };
    newGenerators.push(defaultChannelPayloadGenerator);
  }
  return newGenerators;
}
