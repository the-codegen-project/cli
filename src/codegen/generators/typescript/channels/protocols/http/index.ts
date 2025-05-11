/* eslint-disable security/detect-object-injection */
import {
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {findNameFromOperation, findOperationId, findReplyId} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {ChannelInterface} from '@asyncapi/parser';
import {SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {renderHttpFetchClient} from './fetch';

export {renderHttpFetchClient};

export async function generatehttpChannels(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[]
) {
  const {generator, parameter, topic} = context;
  const ignoreOperation = !generator.asyncapiGenerateForOperations;
  let renders: any[] = [];
  const operations = channel.operations().all();
  if (operations.length > 0 && !ignoreOperation) {
    renders = generateForOperations(context, channel, topic, parameter);
  }
  addRendersToExternal(
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  );
}

function addRendersToExternal(
  renders: SingleFunctionRenderType[],
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  dependencies: string[],
  parameter?: ConstrainedObjectModel
) {
  protocolCodeFunctions['http'].push(...renders.map((value) => value.code));

  externalProtocolFunctionInformation['http'].push(
    ...renders.map((value) => ({
      functionType: value.functionType,
      functionName: value.functionName,
      messageType: value.messageType,
      replyType: value.replyType,
      parameterType: parameter?.type
    }))
  );
  const renderedDependencies = renders
    .map((value) => value.dependencies)
    .flat(Infinity);
  dependencies.push(...(new Set(renderedDependencies) as any));
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  topic: string,
  parameters: ConstrainedObjectModel | undefined
): SingleFunctionRenderType[] {
  const renders: SingleFunctionRenderType[] = [];
  const {generator, payloads} = context;
  const functionTypeMapping = generator.functionTypeMapping[channel.id()];

  for (const operation of channel.operations().all()) {
    const updatedFunctionTypeMapping =
      getFunctionTypeMappingFromAsyncAPI(operation) ?? functionTypeMapping;
    const action = operation.action();
    if (
      shouldRenderFunctionType(
        updatedFunctionTypeMapping,
        ChannelFunctionTypes.HTTP_CLIENT,
        action,
        generator.asyncapiReverseOperations
      )
    ) {
      const payloadId = findOperationId(operation, channel);
      const payload = payloads.operationModels[payloadId];
      if (payload === undefined) {
        throw new Error(
          `Could not find payload for ${payloadId} for channel typescript generator ${JSON.stringify(payloads.operationModels, null, 4)}`
        );
      }
      const {messageModule, messageType} = getMessageTypeAndModule(payload);
      const reply = operation.reply();
      if (reply) {
        const replyId = findReplyId(operation, reply, channel);
        const replyMessageModel = payloads.operationModels[replyId];
        if (!replyMessageModel) {
          throw new Error(
            `Could not find payload for reply ${replyId} for channel typescript generator`
          );
        }
        const statusCodes = operation
          .reply()
          ?.messages()
          .all()
          .map((value) => {
            const statusCode = Number(
              value.bindings().get('http')?.json()['statusCode']
            );
            return {
              code: statusCode,
              description: value.description() ?? 'Unknown',
              messageModule,
              messageType
            };
          });
        const {
          messageModule: replyMessageModule,
          messageType: replyMessageType
        } = getMessageTypeAndModule(replyMessageModel);
		const httpMethod =
		operation.bindings().get('http')?.json()['method'] ?? 'GET';
		renders.push(
		renderHttpFetchClient({
			subName: findNameFromOperation(operation, channel),
			requestMessageModule: messageModule,
			requestMessageType: messageType,
			replyMessageModule,
			replyMessageType,
			requestTopic: topic,
			method: httpMethod.toUpperCase(),
			statusCodes,
			channelParameters:
			parameters !== undefined ? (parameters as any) : undefined
		})
		);
      }
    }
  }
  return renders;
}
