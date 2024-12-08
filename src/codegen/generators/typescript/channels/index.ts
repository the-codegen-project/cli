/* eslint-disable no-unused-expressions */
/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  TheCodegenConfiguration
} from '../../../types';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderJetstreamPublish} from './protocols/nats/jetstreamPublish';
import {renderJetstreamPullSubscribe} from './protocols/nats/jetstreamPullSubscribe';
import {
  defaultTypeScriptParametersOptions,
  TypeScriptParameterRenderType,
  TypescriptParametersGenerator
} from '../parameters';
import { OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadRenderType,
  defaultTypeScriptPayloadGenerator
} from '../payloads';
import {renderCorePublish} from './protocols/nats/corePublish';
import {renderCoreSubscribe} from './protocols/nats/coreSubscribe';
import {renderJetstreamPushSubscription} from './protocols/nats/jetstreamPushSubscription';
import { findNameFromChannel} from '../../../utils';
import { findReplyId } from '../../helpers/payloads';
import { renderCoreRequest } from './protocols/nats/coreRequest';
import { renderCoreReply } from './protocols/nats/coreReply';
import { shouldRenderPublish, shouldRenderRequestReply, shouldRenderSubscribe } from './asyncapi';
import { renderedFunctionType, TypeScriptChannelRenderType, TypeScriptChannelsContext, TypeScriptChannelsGenerator, defaultTypeScriptChannelsGenerator, TypeScriptChannelsGeneratorInternal, zodTypescriptChannelsGenerator, ChannelFunctionTypes} from './types';
import { addParametersToDependencies, addPayloadsToDependencies, getMessageTypeAndModule } from './utils';
export {
  renderedFunctionType, 
  TypeScriptChannelRenderType, 
  TypeScriptChannelsContext,
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGenerator,
  TypeScriptChannelsGeneratorInternal,
  zodTypescriptChannelsGenerator,
  ChannelFunctionTypes
};
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
  ] as TypeScriptParameterRenderType;
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
  addPayloadsToDependencies([...Object.values(payloads.channelModels), ...Object.values(payloads.operationModels)], payloads.generator, context.generator, dependencies);
  addParametersToDependencies(parameters.channelModels, parameters.generator, context.generator, dependencies);
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
    }

    const payload = payloads.channelModels[channel.id()];
    if (payload === undefined) {
      throw new Error(
        `Could not find payload for ${channel.id()} for channel typescript generator`
      );
    }
    const {messageModule, messageType } = getMessageTypeAndModule(payload);
    for (const protocol of protocolsToUse) {
      const simpleContext = {
        subName: findNameFromChannel(channel),
        topic: channel.address()!,
        channelParameters:
          parameter !== undefined ? (parameter.model as any) : undefined,
        messageType,
        messageModule
      };
      const functionTypeMapping = generator.functionTypeMapping[channel.id()];
      switch (protocol) {
        case 'nats': {
          // AsyncAPI v2 explicitly say to use RFC 6570 URI template, NATS JetStream does not support '/' subjects.
          let topic = simpleContext.topic;
          if (topic.startsWith('/')) {
            topic = topic.slice(1);
          }
          topic = topic.replace(/\//g, '.');
          const natsContext = {...simpleContext, topic};
          const renders = [
            renderJetstreamPullSubscribe(natsContext),
            renderJetstreamPushSubscription(natsContext),
            renderJetstreamPublish(natsContext)
          ];
          
          if (shouldRenderPublish(functionTypeMapping, 'send', generator.asyncapiReverseOperations)) {
            renders.push(renderCorePublish(natsContext));
          }
          if (shouldRenderSubscribe(functionTypeMapping, 'receive', generator.asyncapiReverseOperations)) {
            renders.push(renderCoreSubscribe(natsContext));
          }
          for (const operation of channel.operations().all()) {
            const reply = operation.reply();
            if (reply) {
              const replyId = findReplyId(operation, reply);
              const replyMessageModel = payloads.operationModels[replyId];
              const {messageModule: replyMessageModule, messageType: replyMessageType } = getMessageTypeAndModule(replyMessageModel);
              const {shouldRenderReply, shouldRenderRequest} = shouldRenderRequestReply(functionTypeMapping, operation.action(), generator.asyncapiReverseOperations);
              if (shouldRenderRequest) {
                renders.push(
                  renderCoreRequest({
                    requestMessageModule: messageModule,
                    requestMessageType: messageType,
                    replyMessageModule,
                    replyMessageType,
                    requestTopic: topic,
                    channelParameters: parameter !== undefined ? (parameter.model as any) : undefined,
                  })
                );
              } else if (shouldRenderReply) {
                renders.push(
                  renderCoreReply({
                    requestMessageModule: messageModule,
                    requestMessageType: messageType,
                    replyMessageModule,
                    replyMessageType,
                    requestTopic: topic,
                    channelParameters: parameter !== undefined ? (parameter.model as any) : undefined,
                  })
                );
              }
            }
          }
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );

          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType as any,
                functionName: value.functionName,
                messageType: payload.messageType,
                parameterType: parameter?.model?.type
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
  const result = `${dependenciesToRender.join('\n')}
export const Protocols = {
${Object.entries(protocolCodeFunctions)
  .map(([protocol, functions]) => {
    return `${protocol}: {
  ${functions.join(',\n')}
}`;
  })
  .join(',\n')}};`;
  await writeFile(
    path.resolve(context.generator.outputPath, 'index.ts'),
    result,
    {}
  );
  return {
    parameterRender: parameters,
    payloadRender: payloads,
    generator,
    renderedFunctions: externalProtocolFunctionInformation,
    result,
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
