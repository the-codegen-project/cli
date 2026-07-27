/* eslint-disable security/detect-object-injection */
import {
  TypeScriptChannelRenderedFunctionType,
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext
} from '../../types';
import {
  findNameFromOperation,
  findOperationId,
  findReplyId,
  getOperationMetadata
} from '../../../../../utils';
import {
  getMessageTypeAndModule,
  attachGroupingMetadata,
  addRendersToExternal
} from '../../utils';
import {
  shouldRenderFunctionType,
  getFunctionTypeMappingFromAsyncAPI
} from '../../asyncapi';
import {AsyncAPIDocumentInterface, ChannelInterface} from '@asyncapi/parser';
import {HttpRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {renderHttpCommonTypes} from './common-types';
import {renderHttpFetchClient} from './client';

// Re-export main functions for backward compatibility
export {renderHttpCommonTypes, renderHttpFetchClient};

// Re-export security utilities for external use
export {
  analyzeSecuritySchemes,
  escapeStringForCodeGen,
  getApiKeyDefaults,
  renderOAuth2Helpers,
  renderSecurityTypes,
  type AuthTypeRequirements
} from './security';

// Re-export types
export type {SecuritySchemeOptions} from '../../types';

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

  // Generate common types once for the HTTP protocol (stateless check)
  if (protocolCodeFunctions['http_client'].length === 0 && renders.length > 0) {
    const commonTypesCode = renderHttpCommonTypes();
    // Prepend common types to the beginning of the protocol code
    protocolCodeFunctions['http_client'].unshift(commonTypesCode);
  }

  addRendersToExternal({
    protocol: 'http_client',
    renders,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  });
}

/**
 * Collect HTTP(S) server URLs from an AsyncAPI document as quoted string
 * literals ready to be inlined as the generated client's default baseURL.
 * Non-HTTP servers (nats, kafka, …) are not applicable to the HTTP client.
 */
function getAsyncAPIHttpServerUrls(
  asyncapiDocument?: AsyncAPIDocumentInterface
): string[] {
  if (!asyncapiDocument) {
    return [];
  }
  return asyncapiDocument
    .servers()
    .all()
    .filter((server) =>
      ['http', 'https'].includes((server.protocol() ?? '').toLowerCase())
    )
    .map((server) => {
      const pathname =
        typeof server.pathname === 'function' ? server.pathname() : undefined;
      return `'${server.protocol()}://${server.host()}${pathname ?? ''}'`;
    });
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function generateForOperations(
  context: TypeScriptChannelsGeneratorContext,
  channel: ChannelInterface,
  topic: string,
  parameters: ConstrainedObjectModel | undefined
): HttpRenderType[] {
  const renders: HttpRenderType[] = [];
  const {generator, payloads, headers} = context;
  const servers = getAsyncAPIHttpServerUrls(context.asyncapiDocument);
  const functionTypeMapping = generator.functionTypeMapping?.[channel.id()];

  for (const operation of channel.operations().all()) {
    const rendersBeforeOperation = renders.length;
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
        const {description, deprecated} = getOperationMetadata(operation);
        renders.push(
          renderHttpFetchClient({
            subName: findNameFromOperation(operation, channel),
            requestMessageModule: hasBody ? messageModule : undefined,
            requestMessageType: hasBody ? messageType : undefined,
            replyMessageModule,
            replyMessageType,
            requestTopic: topic,
            method: httpMethod.toUpperCase(),
            servers,
            channelParameters:
              parameters !== undefined ? parameters : undefined,
            channelHeaders: headers,
            includesStatusCodes: replyIncludesStatusCodes,
            description,
            deprecated
          })
        );
      }
    }
    attachGroupingMetadata({
      renders: renders.slice(rendersBeforeOperation),
      operation,
      channel,
      topic
    });
  }
  return renders;
}
