/* eslint-disable security/detect-object-injection */
import {
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {
  findNameFromOperation,
  findOperationId,
  findReplyId
} from '../../../../../utils';
import {getMessageTypeAndModule} from '../../utils';
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {ChannelInterface} from '@asyncapi/parser';
import {HttpRenderType, SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {renderHttpFetchClient, renderHttpCommonTypes} from './fetch';

export {renderHttpFetchClient, renderHttpCommonTypes};

// Track whether common types have been generated for this protocol
let httpCommonTypesGenerated = false;

/**
 * Reset the common types generation state.
 * Called at the start of each generation cycle.
 */
export function resetHttpCommonTypesState(): void {
  httpCommonTypesGenerated = false;
}

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

  // Generate common types once for the HTTP protocol
  if (!httpCommonTypesGenerated && renders.length > 0) {
    const commonTypesCode = renderHttpCommonTypes();
    // Prepend common types to the beginning of the protocol code
    protocolCodeFunctions['http_client'].unshift(commonTypesCode);
    httpCommonTypesGenerated = true;
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
  protocolCodeFunctions['http_client'].push(
    ...renders.map((value) => value.code)
  );

  externalProtocolFunctionInformation['http_client'].push(
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
): HttpRenderType[] {
  const renders: HttpRenderType[] = [];
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
      const httpMethod =
        operation.bindings().get('http')?.json()['method'] ?? 'GET';
      const payloadId = findOperationId(operation, channel);
      const payload = payloads.operationModels[payloadId];
      const methodsWithBody = ['POST', 'PUT', 'PATCH'];
      const hasBody = methodsWithBody.includes(httpMethod.toUpperCase());
      const {messageModule, messageType} = getMessageTypeAndModule(payload);
      const reply = operation.reply();
      if (reply) {
        const replyId = findReplyId(operation, reply, channel);
        const replyMessageModel = payloads.operationModels[replyId];
        if (!replyMessageModel) {
          throw new Error(
            `Could not find payload for reply ${replyId} for channel typescript generator for HTTP`
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
          messageType: replyMessageType,
          includesStatusCodes: replyIncludesStatusCodes
        } = getMessageTypeAndModule(replyMessageModel);
        if (replyMessageType === undefined) {
          throw new Error(
            `Could not find reply message type for channel typescript generator for HTTP`
          );
        }
        renders.push(
          renderHttpFetchClient({
            subName: findNameFromOperation(operation, channel),
            requestMessageModule: hasBody ? messageModule : undefined,
            requestMessageType: hasBody ? messageType : undefined,
            replyMessageModule,
            replyMessageType,
            requestTopic: topic,
            method: httpMethod.toUpperCase(),
            statusCodes,
            channelParameters:
              parameters !== undefined ? parameters : undefined,
            includesStatusCodes: replyIncludesStatusCodes
          })
        );
      }
    }
  }
  return renders;
}
