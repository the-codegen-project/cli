/**
 * OpenAPI producer for the TypeScript channels generator.
 *
 * Walks the document's `paths` and emits one `ChannelInfo` per
 * (path, method) pair. Every channel is tagged with
 * `protocols: ['http_client']` because OpenAPI today only drives the
 * HTTP client protocol; if a future pass surfaces non-HTTP protocols
 * via OpenAPI extensions, this list would expand.
 *
 * Channel id is set to the operation id so it matches the parameter
 * lookup key used by the OpenAPI parameters producer.
 */
/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {pascalCase} from '../../../generators/typescript/utils';
import {
  Action,
  ChannelInfo,
  ChannelGeneratorInput,
  HttpMethod,
  MessageRef,
  OperationInfo,
  ProtocolName
} from '../../../generators/typescript/channels/input';

const OPENAPI_PROTOCOLS: ProtocolName[] = ['http_client'];

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head'
] as const;
type HttpMethodLower = (typeof HTTP_METHODS)[number];

type OpenAPIDocument =
  | OpenAPIV3.Document
  | OpenAPIV2.Document
  | OpenAPIV3_1.Document;

type OpenAPIOperation =
  | OpenAPIV3.OperationObject
  | OpenAPIV2.OperationObject
  | OpenAPIV3_1.OperationObject;

function methodToHttpMethod(method: HttpMethodLower): HttpMethod {
  return method.toUpperCase() as HttpMethod;
}

function getOperationId(
  operation: OpenAPIOperation,
  method: string,
  path: string
): string {
  if (operation.operationId) {
    return operation.operationId;
  }
  return `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`;
}

function buildOperationInfo(
  operation: OpenAPIOperation,
  method: HttpMethodLower,
  path: string
): OperationInfo {
  const id = getOperationId(operation, method, path);
  const subName = pascalCase(id);
  const replyId = `${id}_Response`;
  const description = operation.description ?? operation.summary;
  const deprecated = operation.deprecated === true;

  // OpenAPI requests are always "send" from the client's perspective.
  const action: Action = 'send';

  // The HTTP client always implies a reply (the response). Empty
  // messages array is fine — the protocol generator looks up the
  // payload via `replyId`, not via message refs.
  const replyMessages: MessageRef[] = [];

  return {
    id,
    channelId: id,
    subName,
    action,
    description,
    deprecated,
    messages: [],
    reply: {
      replyId,
      messages: replyMessages
    },
    http: {method: methodToHttpMethod(method)}
  };
}

export function produceOpenAPIChannelInput(
  openapiDocument: OpenAPIDocument
): ChannelGeneratorInput {
  const channels: ChannelInfo[] = [];

  for (const [path, pathItem] of Object.entries(openapiDocument.paths ?? {})) {
    if (!pathItem) {
      continue;
    }
    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as
        | OpenAPIOperation
        | undefined;
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      const opInfo = buildOperationInfo(operation, method, path);
      channels.push({
        id: opInfo.id,
        address: path,
        subName: opInfo.subName,
        protocols: OPENAPI_PROTOCOLS,
        hasParameters: false,
        operations: [opInfo],
        messages: []
      });
    }
  }

  return {channels};
}
