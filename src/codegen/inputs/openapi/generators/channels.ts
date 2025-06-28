/* eslint-disable security/detect-object-injection */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {TypeScriptParameterRenderType} from '../../../generators/typescript/parameters';
import {TypeScriptPayloadRenderType} from '../../../generators/typescript/payloads';
import {
  TypeScriptChannelRenderedFunctionType,
  SupportedProtocols,
  TypeScriptChannelsContext,
  TypeScriptChannelsGeneratorContext
} from '../../../generators/typescript/channels/types';
import {ConstrainedObjectModel, OutputModel} from '@asyncapi/modelina';
import {addRendersToExternal, renderHttpFetchClient} from '../../../generators/typescript/channels/protocols/http';
import {getMessageTypeAndModule} from '../../../generators/typescript/channels/utils';
import {HttpRenderType} from '../../../types';

type OpenAPIOperationObject = OpenAPIV3.OperationObject | OpenAPIV2.OperationObject | OpenAPIV3_1.OperationObject;
type OpenAPIPathItemObject = OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject | OpenAPIV3_1.PathItemObject;

export async function generateTypeScriptChannelsForOpenAPI({
  context,
  parameters,
  payloads,
  protocolsToUse,
  protocolCodeFunctions,
  externalProtocolFunctionInformation,
  dependencies
}: {
  context: TypeScriptChannelsContext;
  parameters: TypeScriptParameterRenderType;
  payloads: TypeScriptPayloadRenderType;
  protocolsToUse: SupportedProtocols[];
  protocolCodeFunctions: Record<string, string[]>;
  externalProtocolFunctionInformation: Record<string, TypeScriptChannelRenderedFunctionType[]>;
  dependencies: string[];
}): Promise<void> {
  const {openapiDocument} = validateOpenapiContext({context});
  
  // Only process HTTP client protocol for OpenAPI
  if (!protocolsToUse.includes('http_client')) {
    return;
  }

  const paths = openapiDocument.paths ?? {};
  
  for (const [pathString, pathItem] of Object.entries(paths)) {
    if (!pathItem) {continue;}

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object' || method === 'parameters') {
        continue;
      }

      const operationObj = operation as OpenAPIOperationObject;

      const operationId = getOperationId({
        operation: operationObj,
        method,
        path: pathString
      });
      const subName = getOperationName({
        operation: operationObj,
        method,
        path: pathString
      });
      
      // Get path parameters
      let parameter: OutputModel | undefined = undefined;
      const pathParameters = getPathParameters({
        pathItem,
        operation: operationObj
      });
      if (pathParameters.length > 0) {
        const pathParameterKey = `${pathString}_${method}`;
        parameter = parameters.channelModels[pathParameterKey];
      }

      const protocolContext: TypeScriptChannelsGeneratorContext = {
        ...context,
        subName,
        topic: pathString,
        parameter: parameter?.model as ConstrainedObjectModel,
        payloads
      };

      await generateOpenAPIHttpChannels({
        context: protocolContext,
        path: pathString,
        method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
        operationId,
        subName,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        dependencies
      });
    }
  }
}

function validateOpenapiContext({
  context
}: {
  context: TypeScriptChannelsContext;
}): {
  openapiDocument: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
} {
  const {openapiDocument, inputType} = context;
  if (inputType !== 'openapi') {
    throw new Error('Expected OpenAPI input, was not given');
  }
  if (openapiDocument === undefined) {
    throw new Error('Expected a parsed OpenAPI document, was not given');
  }
  return {openapiDocument};
}

function getOperationId({
  operation,
  method,
  path
}: {
  operation: OpenAPIOperationObject;
  method: string;
  path: string;
}): string {
  return operation.operationId ?? `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`;
}

function getOperationName({
  operation,
  method,
  path
}: {
  operation: OpenAPIOperationObject;
  method: string;
  path: string;
}): string {
  const operationId = getOperationId({operation, method, path});
  return operationId.charAt(0).toUpperCase() + operationId.slice(1);
}

function getPathParameters({
  pathItem,
  operation
}: {
  pathItem: OpenAPIPathItemObject;
  operation: OpenAPIOperationObject;
}): any[] {
  const pathParameters = (pathItem.parameters ?? []) as any[];
  const operationParameters = (operation.parameters ?? []) as any[];
  
  return [...pathParameters, ...operationParameters].filter(param => {
    if ('$ref' in param) {return false;}
    return param.in === 'path';
  });
}

function getServers({
  openapiDocument
}: {
  openapiDocument: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
}): string[] {
  if ('servers' in openapiDocument && openapiDocument.servers) {
    return openapiDocument.servers.map(server => server.url);
  }
  
  if ('host' in openapiDocument && openapiDocument.host) {
    const scheme = 'schemes' in openapiDocument && openapiDocument.schemes ? openapiDocument.schemes[0] : 'https';
    const basePath = 'basePath' in openapiDocument && openapiDocument.basePath ? openapiDocument.basePath : '';
    return [`${scheme}://${openapiDocument.host}${basePath}`];
  }
  
  return ['http://localhost'];
}

export async function generateOpenAPIHttpChannels({
  context,
  path,
  method,
  operationId,
  subName,
  protocolCodeFunctions,
  externalProtocolFunctionInformation,
  dependencies
}: {
  context: TypeScriptChannelsGeneratorContext;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  operationId: string;
  subName: string;
  protocolCodeFunctions: Record<string, string[]>;
  externalProtocolFunctionInformation: Record<string, TypeScriptChannelRenderedFunctionType[]>;
  dependencies: string[];
}) {
  const {parameter, payloads, openapiDocument} = context;
  const renders: HttpRenderType[] = [];

  // Get request payload (for POST, PUT, PATCH methods)
  let requestPayload = undefined;
  let requestMessageType: string | undefined = undefined;
  let requestMessageModule: string | undefined = undefined;

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    requestPayload = payloads.operationModels[operationId];
    if (requestPayload) {
      const {messageModule, messageType} = getMessageTypeAndModule(requestPayload);
      requestMessageType = messageType;
      requestMessageModule = messageModule;
    }
  }

  // Get response payload
  const responsePayload = payloads.operationModels[`${operationId}_Response`];
  if (!responsePayload) {
    throw new Error(
      `Could not find response payload for ${operationId} for OpenAPI channel typescript generator`
    );
  }

  const {messageModule: replyMessageModule, messageType: replyMessageType} = getMessageTypeAndModule(responsePayload);
  if (replyMessageType === undefined) {
    throw new Error(
      `Could not find reply message type for ${operationId} for OpenAPI channel typescript generator for HTTP`
    );
  }

  // Get servers
  const servers = getServers({openapiDocument: openapiDocument!});

  const httpRender = renderHttpFetchClient({
    subName,
    requestMessageModule,
    requestMessageType,
    replyMessageModule,
    replyMessageType,
    requestTopic: path,
    method,
    servers,
    channelParameters: parameter !== undefined ? (parameter as any) : undefined
  });

  // Convert HttpRenderType to SingleFunctionRenderType
  const singleFunctionRender = {
    ...httpRender,
    messageType: httpRender.messageType ?? ''
  };

  renders.push(singleFunctionRender);

  addRendersToExternal(
    renders as any,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    dependencies,
    parameter
  );
} 
