import {
  GenericCodegenContext,
  GenericGeneratorOptions,
  TheCodegenConfiguration
} from '../../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderJetstreamPublish} from './protocols/nats/jetstreamPublish';
import {renderJetstreamPullSubscribe} from './protocols/nats/pullSubscribe';
import {
  TypescriptParametersGenerator,
  defaultTypeScriptParametersOptions
} from '../parameters';
import {OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptPayloadGenerator,
  defaultTypeScriptPayloadGenerator
} from '../payloads';
import {z} from 'zod';
export type SupportedProtocols = 'nats';
export interface TypeScriptChannelsGenerator extends GenericGeneratorOptions {
  preset: 'channels';
  outputPath: string;
  language?: 'typescript';
  payloadGeneratorId?: string;
  parameterGeneratorId?: string;
  protocols: SupportedProtocols[];
}

export const zodTypescriptChannelsGenerator = z.object({
  id: z.string().optional().default('channels-typescript'),
  dependencies: z.array(z.string()).optional(),
  preset: z.literal('channels'),
  outputPath: z.string(),
  protocols: z.array(z.enum(['nats'])),
  parameterGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript parameter generators, you can specify which one to use as the dependency for this channels generator.'
    ),
  payloadGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript payload generators, you can specify which one to use as the dependency for this channels generator.'
    ),
  serializationType: z.literal('json').optional(),
  language: z.literal('typescript').optional()
});

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
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptChannelsGenerator;
}

export async function generateTypeScriptChannels(
  context: TypeScriptChannelsContext
) {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  if (!context.dependencyOutputs) {
    throw new Error(
      'Internal error, could not determine previous rendered outputs that is required for channel typescript generator'
    );
  }
  const payloads = context.dependencyOutputs['payloads-typescript'];
  const parameters = context.dependencyOutputs['parameters-typescript'];
  if (!payloads) {
    throw new Error(
      'Internal error, could not determine previous rendered payloads generator that is required for channel typescript generator'
    );
  }
  if (!parameters) {
    throw new Error(
      'Internal error, could not determine previous rendered parameters generator that is required for channel typescript generator'
    );
  }

  const codeToRender: string[] = [];
  const dependencies: string[] = [];
  for (const channel of asyncapiDocument!.allChannels().all()) {
    const protocolsToUse = generator.protocols;
    const parameter = parameters.channelModels[channel.id()] as OutputModel;
    if (parameter === undefined) {
      throw new Error(
        `Could not find parameter for ${channel.id()} for channel typescript generator`
      );
    }

    const parameterGenerator =
      parameters.generator as TypescriptParametersGenerator;
    const parameterImportPath = path.relative(
      context.generator.outputPath,
      path.resolve(parameterGenerator.outputPath, parameter.modelName)
    );

    dependencies.push(
      `import {${parameter.modelName}} from '${parameterImportPath}';`
    );
    const payload = payloads.channelModels[channel.id()] as OutputModel;
    if (payload === undefined) {
      throw new Error(
        `Could not find payload for ${channel.id()} for channel typescript generator`
      );
    }
    const payloadGenerator = payloads.generator as TypeScriptPayloadGenerator;
    const payloadImportPath = path.relative(
      context.generator.outputPath,
      path.resolve(payloadGenerator.outputPath, payload.modelName)
    );
    dependencies.push(
      `import {${payload.modelName}} from '${payloadImportPath}';`
    );

    for (const protocol of protocolsToUse) {
      const simpleContext = {
        topic: channel.address()!,
        channelParameters: parameter.model as any,
        message: payload.model as any
      };
      switch (protocol) {
        case 'nats': {
          // AsyncAPI v2 explicitly say to use RFC 6570 URI template, NATS JetStream does not support '/' subjects.
          let topic = simpleContext.topic;
          topic = topic.replace(/\//g, '.');
          const natsContext = {...simpleContext, topic};
          const renders = [
            //renderJetstreamFetch(simpleContext),
            renderJetstreamPublish(natsContext),
            renderJetstreamPullSubscribe(natsContext)
          ];
          codeToRender.push(...renders.map((value) => value.code));
          const deps = renders
            .map((value) => value.dependencies)
            .flat(Infinity);
          dependencies.push(...(new Set(deps) as any));
          break;
        }

        default: {
          break;
        }
      }
    }
  }
  await mkdir(context.generator.outputPath, {recursive: true});
  await writeFile(
    path.resolve(context.generator.outputPath, 'index.ts'),
    `${dependencies.join('\n')}\n${codeToRender.join('\n\n')}`,
    {}
  );
}

/**
 * Make sure we include all dependencies, if not added manually, is added to the generators.
 */
export function includeTypeScriptChannelDependencies(
  config: TheCodegenConfiguration,
  generator: TypeScriptChannelsGenerator
) {
  const newGenerators: any[] = [];
  const parameterGeneratorId = generator.parameterGeneratorId;
  const payloadGeneratorId = generator.payloadGeneratorId;
  const hasParameterGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === parameterGeneratorId
    ) !== undefined;
  const hasPayloadGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === payloadGeneratorId
    ) !== undefined;
  if (!hasParameterGenerator) {
    newGenerators.push(defaultTypeScriptParametersOptions);
  }
  if (!hasPayloadGenerator) {
    newGenerators.push(defaultTypeScriptPayloadGenerator);
  }
  return newGenerators;
}
