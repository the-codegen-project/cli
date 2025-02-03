/* eslint-disable no-unused-expressions */
/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {TheCodegenConfiguration} from '../../../types';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {renderJetstreamPublish} from './protocols/nats/jetstreamPublish';
import {renderJetstreamPullSubscribe} from './protocols/nats/jetstreamPullSubscribe';
import {
  defaultTypeScriptParametersOptions,
  TypeScriptParameterRenderType,
  TypescriptParametersGenerator
} from '../parameters';
import {OutputModel} from '@asyncapi/modelina';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadRenderType,
  defaultTypeScriptPayloadGenerator
} from '../payloads';
import {renderCorePublish} from './protocols/nats/corePublish';
import {renderCoreSubscribe} from './protocols/nats/coreSubscribe';
import {renderJetstreamPushSubscription} from './protocols/nats/jetstreamPushSubscription';
import {findNameFromChannel, findNameFromOperation} from '../../../utils';
import {findOperationId, findReplyId} from '../../helpers/payloads';
import {renderCoreRequest} from './protocols/nats/coreRequest';
import {renderCoreReply} from './protocols/nats/coreReply';
import * as MqttRenderer from './protocols/mqtt';
import * as AmqpRenderer from './protocols/amqp';
import * as KafkaRenderer from './protocols/kafka';
import {shouldRenderFunctionType} from './asyncapi';
import {
  renderedFunctionType,
  TypeScriptChannelRenderType,
  TypeScriptChannelsContext,
  TypeScriptChannelsGenerator,
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGeneratorInternal,
  zodTypescriptChannelsGenerator,
  ChannelFunctionTypes,
  RenderRegularParameters
} from './types';
import {
  addParametersToDependencies,
  addPayloadsToDependencies,
  getMessageTypeAndModule
} from './utils';
import { renderHttpClient } from './protocols/http';
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
  addPayloadsToDependencies(
    Object.values(payloads.operationModels),
    payloads.generator,
    context.generator,
    dependencies
  );
  addPayloadsToDependencies(
    Object.values(payloads.channelModels),
    payloads.generator,
    context.generator,
    dependencies
  );
  addPayloadsToDependencies(
    Object.values(payloads.otherModels),
    payloads.generator,
    context.generator,
    dependencies
  );
  addParametersToDependencies(
    parameters.channelModels,
    parameters.generator,
    context.generator,
    dependencies
  );
  for (const channel of asyncapiDocument!.allChannels().all()) {
    if (!channel.address()) {
      continue;
    }
    if (channel.messages().length === 0) {
      continue;
    }
    let parameter: OutputModel | undefined = undefined;
    if (channel.parameters().length > 0) {
      parameter = parameters.channelModels[channel.id()];
      if (parameter === undefined) {
        throw new Error(
          `Could not find parameter for ${channel.id()} for channel TypeScript generator`
        );
      }
    }

    for (const protocol of protocolsToUse) {
      const subName = findNameFromChannel(channel);
      const simpleContext = {
        subName,
        topic: channel.address()!,
        channelParameters:
          parameter !== undefined ? (parameter.model as any) : undefined
      };
      const functionTypeMapping = generator.functionTypeMapping[channel.id()];
      const ignoreOperation = !generator.asyncapiGenerateForOperations;
      switch (protocol) {
        case 'nats': {
          // AsyncAPI v2 explicitly say to use RFC 6570 URI template, NATS JetStream does not support '/' subjects.
          let topic = simpleContext.topic;
          if (topic.startsWith('/')) {
            topic = topic.slice(1);
          }
          topic = topic.replace(/\//g, '.');
          let natsContext: RenderRegularParameters = {
            ...simpleContext,
            topic,
            messageType: ''
          };
          const renders = [];
          const operations = channel.operations().all();
          if (operations.length > 0 && !ignoreOperation) {
            for (const operation of operations) {
              const payloadId = findOperationId(operation, channel);
              const payload = payloads.operationModels[payloadId];
              if (payload === undefined) {
                throw new Error(
                  `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
                );
              }
              const {messageModule, messageType} =
                getMessageTypeAndModule(payload);
              natsContext = {
                ...natsContext,
                messageType,
                messageModule,
                subName: findNameFromOperation(operation, channel)
              };

              const reply = operation.reply();
              if (reply) {
                const replyId = findReplyId(operation, reply, channel);
                const replyMessageModel = payloads.operationModels[replyId];
                if (!replyMessageModel) {
                  continue;
                }
                const {
                  messageModule: replyMessageModule,
                  messageType: replyMessageType
                } = getMessageTypeAndModule(replyMessageModel);
                const shouldRenderReply = shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.NATS_REPLY,
                  operation.action(),
                  generator.asyncapiReverseOperations
                );
                const shouldRenderRequest = shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.NATS_REQUEST,
                  operation.action(),
                  generator.asyncapiReverseOperations
                );
                if (shouldRenderRequest) {
                  renders.push(
                    renderCoreRequest({
                      subName: findNameFromOperation(operation, channel),
                      requestMessageModule: messageModule,
                      requestMessageType: messageType,
                      replyMessageModule,
                      replyMessageType,
                      requestTopic: topic,
                      channelParameters:
                        parameter !== undefined
                          ? (parameter.model as any)
                          : undefined
                    })
                  );
                } else if (shouldRenderReply) {
                  renders.push(
                    renderCoreReply({
                      subName: findNameFromOperation(operation, channel),
                      requestMessageModule: replyMessageModule,
                      requestMessageType: replyMessageType,
                      replyMessageModule: messageModule,
                      replyMessageType: messageType,
                      requestTopic: topic,
                      channelParameters:
                        parameter !== undefined
                          ? (parameter.model as any)
                          : undefined
                    })
                  );
                }
              } else {
                const action = operation.action();
                if (
                  shouldRenderFunctionType(
                    functionTypeMapping,
                    ChannelFunctionTypes.NATS_PUBLISH,
                    action,
                    generator.asyncapiReverseOperations
                  )
                ) {
                  renders.push(renderCorePublish(natsContext));
                }
                if (
                  shouldRenderFunctionType(
                    functionTypeMapping,
                    ChannelFunctionTypes.NATS_SUBSCRIBE,
                    action,
                    generator.asyncapiReverseOperations
                  )
                ) {
                  renders.push(renderCoreSubscribe(natsContext));
                }
                if (
                  shouldRenderFunctionType(
                    functionTypeMapping,
                    ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
                    action,
                    generator.asyncapiReverseOperations
                  )
                ) {
                  renders.push(renderJetstreamPullSubscribe(natsContext));
                }
                if (
                  shouldRenderFunctionType(
                    functionTypeMapping,
                    ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
                    action,
                    generator.asyncapiReverseOperations
                  )
                ) {
                  renders.push(renderJetstreamPushSubscription(natsContext));
                }
                if (
                  shouldRenderFunctionType(
                    functionTypeMapping,
                    ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
                    action,
                    generator.asyncapiReverseOperations
                  )
                ) {
                  renders.push(renderJetstreamPublish(natsContext));
                }
              }
            }
          } else {
            const payload = payloads.channelModels[channel.id()];
            if (payload === undefined) {
              throw new Error(
                `Could not find payload for ${channel.id()} for channel typescript generator`
              );
            }
            const {messageModule, messageType} =
              getMessageTypeAndModule(payload);
            natsContext = {...natsContext, messageType, messageModule};
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.NATS_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(renderCorePublish(natsContext));
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.NATS_SUBSCRIBE,
                'receive',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(renderCoreSubscribe(natsContext));
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
                'receive',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(renderJetstreamPullSubscribe(natsContext));
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
                'receive',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(renderJetstreamPushSubscription(natsContext));
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(renderJetstreamPublish(natsContext));
            }
          }
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );

          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType,
                functionName: value.functionName,
                messageType: value.messageType,
                replyType: value.replyType,
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
        case 'kafka': {
          // AsyncAPI v2 explicitly say to use RFC 6570 URI template, Kafka does not support '/' subject separation, so lets replace it
          let topic = simpleContext.topic;
          if (topic.startsWith('/')) {
            topic = topic.slice(1);
          }
          topic = topic.replace(/\//g, generator.kafkaTopicSeparator);
          let kafkaContext: RenderRegularParameters = {
            ...simpleContext,
            topic,
            messageType: ''
          };
          const renders = [];
          const payload = payloads.channelModels[channel.id()];
          if (payload === undefined) {
            throw new Error(
              `Could not find payload for ${channel.id()} for channel typescript generator`
            );
          }
          const {messageModule, messageType} = getMessageTypeAndModule(payload);
          kafkaContext = {...kafkaContext, messageType, messageModule};
          const operations = channel.operations().all();
          if (operations.length > 0 && !ignoreOperation) {
            for (const operation of operations) {
              const payloadId = findOperationId(operation, channel);
              const payload = payloads.operationModels[payloadId];
              if (payload === undefined) {
                throw new Error(
                  `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
                );
              }
              const {messageModule, messageType} =
                getMessageTypeAndModule(payload);
              kafkaContext = {
                ...kafkaContext,
                messageType,
                messageModule,
                subName: findNameFromOperation(operation, channel)
              };
              const action = operation.action();
              if (
                shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.KAFKA_PUBLISH,
                  action,
                  generator.asyncapiReverseOperations
                )
              ) {
                renders.push(KafkaRenderer.renderPublish(kafkaContext));
              }
              if (
                shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.KAFKA_SUBSCRIBE,
                  action,
                  generator.asyncapiReverseOperations
                )
              ) {
                renders.push(KafkaRenderer.renderSubscribe(kafkaContext));
              }
            }
          } else {
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.KAFKA_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(KafkaRenderer.renderPublish(kafkaContext));
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.KAFKA_SUBSCRIBE,
                'receive',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(KafkaRenderer.renderSubscribe(kafkaContext));
            }
          }
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );

          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType,
                functionName: value.functionName,
                messageType: value.messageType,
                replyType: value.replyType,
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
        case 'mqtt': {
          const topic = simpleContext.topic;
          let mqttContext: RenderRegularParameters = {
            ...simpleContext,
            topic,
            messageType: ''
          };
          const renders = [];
          const operations = channel.operations().all();
          if (operations.length > 0 && !ignoreOperation) {
            for (const operation of operations) {
              const payloadId = findOperationId(operation, channel);
              const payload = payloads.operationModels[payloadId];
              if (payload === undefined) {
                throw new Error(
                  `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
                );
              }
              const {messageModule, messageType} =
                getMessageTypeAndModule(payload);
              mqttContext = {
                ...mqttContext,
                messageType,
                messageModule,
                subName: findNameFromOperation(operation, channel)
              };
              const action = operation.action();
              if (
                shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.MQTT_PUBLISH,
                  action,
                  generator.asyncapiReverseOperations
                )
              ) {
                renders.push(MqttRenderer.renderPublish(mqttContext));
              }
            }
          } else {
            const payload = payloads.channelModels[channel.id()];
            if (payload === undefined) {
              throw new Error(
                `Could not find payload for ${channel.id()} for channel typescript generator`
              );
            }
            const {messageModule, messageType} =
              getMessageTypeAndModule(payload);
            mqttContext = {...mqttContext, messageType, messageModule};
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.MQTT_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(MqttRenderer.renderPublish(mqttContext));
            }
          }
          
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );
          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType,
                functionName: value.functionName,
                messageType: value.messageType,
                replyType: value.replyType,
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
        
        case 'http_client': {
          const topic = simpleContext.topic;
          const renders = [];
          const operations = channel.operations().all();
          if (operations.length > 0) {
            for (const operation of operations) {
              const payloadId = findOperationId(operation, channel);
              const payload = payloads.operationModels[payloadId];
              if (payload === undefined) {
                throw new Error(
                  `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
                );
              }
              const {messageModule, messageType} =
                getMessageTypeAndModule(payload);
              const reply = operation.reply();
              if (reply) {
                const replyId = findReplyId(operation, reply, channel);
                const replyMessageModel = payloads.operationModels[replyId];
                if (!replyMessageModel) {
                  continue;
                }
                const statusCodes = operation.reply()?.messages().all().map((value) => {
                  const statusCode = Number(value.bindings().get('http')?.json()['statusCode']);
                  value.id();
                  return {
                    code: statusCode, description: value.description() ?? 'Unknown', messageModule, messageType
                  };
                });
                const {
                  messageModule: replyMessageModule,
                  messageType: replyMessageType
                } = getMessageTypeAndModule(replyMessageModel);
                const shouldRenderRequest = shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.HTTP_CLIENT,
                  operation.action(),
                  generator.asyncapiReverseOperations
                );
                if (shouldRenderRequest) {
                  const httpMethod = operation.bindings().get('http')?.json()['method'] ?? 'GET';
                  renders.push(
                    renderHttpClient({
                      subName: findNameFromOperation(operation, channel),
                      requestMessageModule: messageModule,
                      requestMessageType: messageType,
                      replyMessageModule,
                      replyMessageType,
                      requestTopic: topic,
                      method: httpMethod.toUpperCase(),
                      statusCodes,
                      channelParameters:
                        parameter !== undefined
                          ? (parameter.model as any)
                          : undefined
                    })
                  );
                }
              }
            }
          }
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );

          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType,
                functionName: value.functionName,
                messageType: value.messageType,
                replyType: value.replyType,
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
        case 'amqp': {
          const topic = simpleContext.topic;
          let amqpContext: RenderRegularParameters = {
            ...simpleContext,
            topic,
            messageType: ''
          };
          const renders = [];
          const operations = channel.operations().all();
          const exchangeName =
            channel.bindings().get('amqp')?.value().exchange.name ?? undefined;
          if (operations.length > 0 && !ignoreOperation) {
            for (const operation of operations) {
              const payloadId = findOperationId(operation, channel);
              const payload = payloads.operationModels[payloadId];
              if (payload === undefined) {
                throw new Error(
                  `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
                );
              }
              const {messageModule, messageType} =
                getMessageTypeAndModule(payload);
              amqpContext = {
                ...amqpContext,
                messageType,
                messageModule,
                subName: findNameFromOperation(operation, channel)
              };
              const action = operation.action();
              if (
                shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
                  action,
                  generator.asyncapiReverseOperations
                )
              ) {
                renders.push(
                  AmqpRenderer.renderPublishExchange({
                    ...amqpContext,
                    additionalProperties: {exchange: exchangeName}
                  })
                );
              }
              if (
                shouldRenderFunctionType(
                  functionTypeMapping,
                  ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
                  action,
                  generator.asyncapiReverseOperations
                )
              ) {
                renders.push(AmqpRenderer.renderPublishQueue(amqpContext));
              }
            }
          } else {
            const payload = payloads.channelModels[channel.id()];
            if (payload === undefined) {
              throw new Error(
                `Could not find payload for ${channel.id()} for channel typescript generator`
              );
            }
            const {messageModule, messageType} =
              getMessageTypeAndModule(payload);
            amqpContext = {...amqpContext, messageType, messageModule};

            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.AMQP_EXCHANGE_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(
                AmqpRenderer.renderPublishExchange({
                  ...amqpContext,
                  additionalProperties: {exchange: exchangeName}
                })
              );
            }
            if (
              shouldRenderFunctionType(
                functionTypeMapping,
                ChannelFunctionTypes.AMQP_QUEUE_PUBLISH,
                'send',
                generator.asyncapiReverseOperations
              )
            ) {
              renders.push(AmqpRenderer.renderPublishQueue(amqpContext));
            }
          }
          protocolCodeFunctions[protocol].push(
            ...renders.map((value) => value.code)
          );
          externalProtocolFunctionInformation[protocol].push(
            ...renders.map((value) => {
              return {
                functionType: value.functionType,
                functionName: value.functionName,
                messageType: value.messageType,
                replyType: value.replyType,
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
    result
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
