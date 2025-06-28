/* eslint-disable security/detect-object-injection */
import {
  TypeScriptChannelRenderedFunctionType
} from '../../types';

import { SingleFunctionRenderType} from '../../../../../types';
import {ConstrainedObjectModel} from '@asyncapi/modelina';
import {renderHttpFetchClient} from './fetch';

export {renderHttpFetchClient};

export function addRendersToExternal(
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
