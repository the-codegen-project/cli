/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  ChannelPayload,
  GenericCodegenContext,
  TheCodegenConfiguration
} from '../../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderJetstreamPublish} from './protocols/nats/jetstreamPublish';
import {renderJetstreamPullSubscribe} from './protocols/nats/jetstreamPullSubscribe';
import {
  defaultTypeScriptParametersOptions,
  TypeScriptparameterRenderType,
  TypescriptParametersGenerator,
  TypescriptParametersGeneratorInternal
} from '../parameters';
import {ConstrainedObjectModel, OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadGeneratorInternal,
  TypeScriptPayloadRenderType,
  defaultTypeScriptPayloadGenerator
} from '../payloads';
import {z} from 'zod';
import {renderCorePublish} from './protocols/nats/corePublish';
import {renderCoreSubscribe} from './protocols/nats/coreSubscribe';
import {renderJetstreamPushSubscription} from './protocols/nats/jetstreamPushSubscription';
import {ensureRelativePath, findNameFromChannel} from '../../../utils';
export type SupportedProtocols = 'nats';

export enum ChannelFunctionTypes {
  NATS_JETSTREAM_PUBLISH = 'nats_jetstream_publish',
  NATS_JETSTREAM_PULL_SUBSCRIBE = 'nats_jetstream_pull_subscribe',
  NATS_JETSTREAM_PUSH_SUBSCRIBE = 'nats_jetstream_push_subscribe',
  NATS_CORE_SUBSCRIBE = 'nats_core_subscribe',
  NATS_CORE_PUBLISH = 'nats_core_publish',
  NATS_REQUEST = 'nats_request',
  NATS_REPLY = 'nats_reply'
}

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

export type TypeScriptChannelsGenerator = z.input<
  typeof zodTypescriptChannelsGenerator
>;
export type TypeScriptChannelsGeneratorInternal = z.infer<
  typeof zodTypescriptChannelsGenerator
>;

export const defaultTypeScriptChannelsGenerator: TypeScriptChannelsGenerator =
  zodTypescriptChannelsGenerator.parse({});

export interface TypeScriptChannelsContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: TypeScriptChannelsGeneratorInternal;
}
export type renderedFunctionType = {
  functionType: ChannelFunctionTypes;
  functionName: string;
  messageType: string;
  parameterType?: string;
};
export interface TypeScriptChannelRenderType {
  payloadRender: TypeScriptPayloadRenderType;
  parameterRender: TypeScriptparameterRenderType;
  generator: TypeScriptChannelsGeneratorInternal;
  // All the rendered functions based on protocol.
  renderedFunctions: Record<string, renderedFunctionType[]>;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypeScriptChannels(
  context: TypeScriptChannelsContext
): Promise<TypeScriptChannelRenderType> {
  const {asyncapiDocument, generator, inputType} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  if (!context.dependencyOutputs) {
    throw new Error(
      'Internal error, could not determine previous rendered outputs that is required for channel typescript generator'
    );
  }
  const payloads = context.dependencyOutputs[
    generator.payloadGeneratorId
  ] as TypeScriptPayloadRenderType;
  const parameters = context.dependencyOutputs[
    generator.parameterGeneratorId
  ] as TypeScriptparameterRenderType;
  if (!payloads) {
    throw new Error(
      'Internal error, could not determine previous rendered payloads generator that is required for channel TypeScript generator'
    );
  }
  if (!parameters) {
    throw new Error(
      'Internal error, could not determine previous rendered parameters generator that is required for channel TypeScript generator'
    );
  }

  const protocolCodeFunctions: Record<string, string[]> = {};
  const externalProtocolFunctionInformation: Record<
    string,
    renderedFunctionType[]
  > = {};
  const protocolsToUse = generator.protocols;
  for (const protocol of protocolsToUse) {
    protocolCodeFunctions[protocol] = [];
    externalProtocolFunctionInformation[protocol] = [];
  }
  const dependencies: string[] = [];
  for (const channel of asyncapiDocument!.allChannels().all()) {
    if (!channel.address()) {
      continue;
    }
    if (channel.messages().length === 0) {
      continue;
    }
    let parameter: OutputModel | undefined = undefined;
    if (channel.parameters().length > 0) {
      parameter = parameters.channelModels[channel.id()] as OutputModel;
      if (parameter === undefined) {
        throw new Error(
          `Could not find parameter for ${channel.id()} for channel TypeScript generator`
        );
      }

      const parameterGenerator =
        parameters.generator as TypescriptParametersGeneratorInternal;
      const parameterImportPath = path.relative(
        context.generator.outputPath,
        path.resolve(parameterGenerator.outputPath, parameter.modelName)
      );

      dependencies.push(
        `import {${parameter.modelName}} from './${ensureRelativePath(parameterImportPath)}';`
      );
    }

    const payload = payloads.channelModels[channel.id()] as ChannelPayload;
    if (payload === undefined) {
      throw new Error(
        `Could not find payload for ${channel.id()} for channel typescript generator`
      );
    }
    const payloadGenerator =
      payloads.generator as TypeScriptPayloadGeneratorInternal;
    const payloadImportPath = path.relative(
      context.generator.outputPath,
      path.resolve(payloadGenerator.outputPath, payload.messageModel.modelName)
    );
    let messageModule;
    if (payload.messageModel.model instanceof ConstrainedObjectModel) {
      dependencies.push(
        `import {${payload.messageModel.modelName}} from './${ensureRelativePath(payloadImportPath)}';`
      );
    } else {
      messageModule = `${payload.messageType}Module`;
      dependencies.push(
        `import * as ${payload.messageModel.modelName}Module from './${ensureRelativePath(payloadImportPath)}';`
      );
    }

    for (const protocol of protocolsToUse) {
      const simpleContext = {
        subName: findNameFromChannel(channel),
        topic: channel.address()!,
        channelParameters:
          parameter !== undefined ? (parameter.model as any) : undefined,
        message: payload.messageModel as any,
        messageType: payload.messageType,
        messageModule
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
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );

          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType as any,
                functionName: value.functionName,
                messageType: payload.messageType,
                parameterType:
                  parameter !== undefined ? parameter.model.type : undefined
              };
            })
          );
          const renderedDependencies = renders
            .map((value) => value.dependencies)
            .flat(Infinity);
          dependencies.push(...(new Set(renderedDependencies) as any));
          break;
        }

        default: {
          break;
        }
      }
    }
  }

  const dependenciesToRender = [...new Set(dependencies)];
  await mkdir(context.generator.outputPath, {recursive: true});
  await writeFile(
    path.resolve(context.generator.outputPath, 'index.ts'),
    `${dependenciesToRender.join('\n')}
export const Protocols = {
${Object.entries(protocolCodeFunctions)
  .map(([protocol, functions]) => {
    return `${protocol}: {
  ${functions.join(',\n')}
}`;
  })
  .join(',\n')}};`,
    {}
  );
  return {
    parameterRender: parameters,
    payloadRender: payloads,
    generator,
    renderedFunctions: externalProtocolFunctionInformation
  };
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
    const defaultChannelParameterGenerator: TypescriptParametersGenerator = {
      ...defaultTypeScriptParametersOptions,
      outputPath: path.resolve(generator.outputPath ?? '', './parameter')
    };
    newGenerators.push(defaultChannelParameterGenerator);
  }
  if (!hasPayloadGenerator) {
    const defaultChannelPayloadGenerator: TypeScriptPayloadGenerator = {
      ...defaultTypeScriptPayloadGenerator,
      outputPath: path.resolve(generator.outputPath ?? '', './payload')
    };
    newGenerators.push(defaultChannelPayloadGenerator);
  }
  return newGenerators;
}
