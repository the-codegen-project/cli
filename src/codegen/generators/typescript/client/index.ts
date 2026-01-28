/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGenerator
} from '../channels';
import {generateNatsClient} from './protocols/nats';
import {TheCodegenConfiguration} from '../../../types';
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

  await mkdir(context.generator.outputPath, {recursive: true});
  const renderedProtocols: Record<SupportedProtocols, string> = {
    nats: ''
  };
  const filesWritten: string[] = [];

  for (const protocol of generator.protocols) {
    switch (protocol) {
      case 'nats': {
        const renderedResult = await generateNatsClient(context);
        const filePath = path.resolve(
          context.generator.outputPath,
          'NatsClient.ts'
        );
        await writeFile(filePath, renderedResult);
        filesWritten.push(filePath);
        renderedProtocols[protocol] = renderedResult;
        break;
      }
      default:
        break;
    }
  }
  return {
    protocolResult: renderedProtocols,
    filesWritten
  };
}

/**
 * Make sure we include all dependencies, if not added manually, is added to the generators.
 */
export function includeTypeScriptClientDependencies(
  config: TheCodegenConfiguration,
  generator: TypeScriptClientGenerator
) {
  const newGenerators: any[] = [];
  const channelsGeneratorId = generator.channelsGeneratorId;
  const hasChannelsGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === channelsGeneratorId
    ) !== undefined;
  if (!hasChannelsGenerator) {
    const defaultChannelPayloadGenerator: TypeScriptChannelsGenerator = {
      ...defaultTypeScriptChannelsGenerator,
      protocols: generator.protocols,
      outputPath: path.resolve(generator.outputPath ?? '', './channels')
    };
    newGenerators.push(defaultChannelPayloadGenerator);
  }
  return newGenerators;
}
