/* eslint-disable sonarjs/no-duplicate-string */
import {GenericCodegenContext, TheCodegenConfiguration} from '../../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderJetstreamPublish} from './protocols/nats/jetstreamPublish';
import {renderJetstreamPullSubscribe} from './protocols/nats/jetstreamPullSubscribe';
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
import {renderCorePublish} from './protocols/nats/corePublish';
import {renderCoreSubscribe} from './protocols/nats/coreSubscribe';
import {renderJetstreamPushSubscription} from './protocols/nats/jetstreamPushSubscription';
export type SupportedProtocols = 'nats';

export const zodTypescriptChannelsGenerator = z.object({
  id: z.string().optional().default('channels-typescript'),
  dependencies: z
    .array(z.string())
    .optional()
    .default(['parameters-typescript', 'payloads-typescript']),
  preset: z.literal('channels').default('channels'),
  outputPath: z.string().default('src/__gen__/channels'),
  protocols: z.array(z.enum(['nats'])).default(['nats']),
  parameterGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript parameter generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('parameters-typescript'),
  payloadGeneratorId: z
    .string()
    .optional()
    .describe(
      'In case you have multiple TypeScript payload generators, you can specify which one to use as the dependency for this channels generator.'
    )
    .default('payloads-typescript'),
  language: z.literal('typescript').optional().default('typescript')
});

export type TypeScriptChannelsGenerator = z.infer<
  typeof zodTypescriptChannelsGenerator
>;

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGenerator =
  zodTypescriptChannelsGenerator.parse({});

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
            renderJetstreamPublish(natsContext),
            renderJetstreamPullSubscribe(natsContext),
            renderJetstreamPushSubscription(natsContext),
            renderCorePublish(natsContext),
            renderCoreSubscribe(natsContext)
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
