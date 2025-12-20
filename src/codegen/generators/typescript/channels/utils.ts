import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {ChannelPayload} from '../../../types';
import path from 'node:path';
import {ensureRelativePath} from '../../../utils';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptParameterRenderType} from '../parameters';
import {TypeScriptHeadersRenderType} from '../headers';
import {TypeScriptChannelsContext} from './types';

export function addPayloadsToDependencies(
  models: ChannelPayload[],
  payloadGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[]
) {
  models
    .filter((payload) => payload)
    .forEach((payload) => {
      const payloadImportPath = path.relative(
        currentGenerator.outputPath,
        path.resolve(
          payloadGenerator.outputPath,
          payload.messageModel.modelName
        )
      );
      if (
        payload.messageModel.model instanceof ConstrainedObjectModel ||
        payload.messageModel.model instanceof ConstrainedEnumModel
      ) {
        dependencies.push(
          `import {${payload.messageModel.modelName}} from './${ensureRelativePath(payloadImportPath)}';`
        );
      } else {
        dependencies.push(
          `import * as ${payload.messageModel.modelName}Module from './${ensureRelativePath(payloadImportPath)}';`
        );
      }
    });
}
export function addPayloadsToExports(
  models: ChannelPayload[],
  dependencies: string[]
) {
  models
    .filter((payload) => payload)
    .forEach((payload) => {
      if (
        payload.messageModel.model instanceof ConstrainedObjectModel ||
        payload.messageModel.model instanceof ConstrainedEnumModel
      ) {
        dependencies.push(`export {${payload.messageModel.modelName}};`);
      } else {
        dependencies.push(`export {${payload.messageModel.modelName}Module};`);
      }
    });
}
export function addParametersToDependencies(
  parameters: Record<string, OutputModel | undefined>,
  parameterGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[]
) {
  Object.values(parameters)
    .filter((model) => model !== undefined)
    .forEach((parameter) => {
      if (parameter === undefined) {
        return;
      }
      const parameterImportPath = path.relative(
        currentGenerator.outputPath,
        path.resolve(parameterGenerator.outputPath, parameter.modelName)
      );

      dependencies.push(
        `import {${parameter.modelName}} from './${ensureRelativePath(parameterImportPath)}';`
      );
    });
}
export function addParametersToExports(
  parameters: Record<string, OutputModel | undefined>,
  dependencies: string[]
) {
  Object.values(parameters)
    .filter((model) => model !== undefined)
    .forEach((parameter) => {
      if (parameter === undefined) {
        return;
      }
      dependencies.push(`export {${parameter.modelName}};`);
    });
}

export function addHeadersToDependencies(
  headers: Record<string, OutputModel | undefined>,
  headerGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[]
) {
  Object.values(headers)
    .filter((model) => model !== undefined)
    .forEach((header) => {
      if (header === undefined) {
        return;
      }
      const headerImportPath = path.relative(
        currentGenerator.outputPath,
        path.resolve(headerGenerator.outputPath, header.modelName)
      );

      dependencies.push(
        `import {${header.modelName}} from './${ensureRelativePath(headerImportPath)}';`
      );
    });
}
export function getMessageTypeAndModule(payload: ChannelPayload) {
  if (payload === undefined) {
    return {messageType: undefined, messageModule: undefined};
  }
  let messageModule;
  if (!(payload.messageModel.model instanceof ConstrainedObjectModel)) {
    messageModule = `${payload.messageType}Module`;
  }
  return {messageType: payload.messageType, messageModule};
}
export function getValidationFunctions({
  includeValidation,
  messageModule,
  messageType,
  onValidationFail
}: {
  includeValidation: boolean;
  messageModule?: string;
  messageType: string;
  onValidationFail: string;
}) {
  let validatorCreation = '';
  let validationFunction = '';
  if (includeValidation) {
    validatorCreation = `const validator = ${messageModule ?? messageType}.createValidator();`;
    validationFunction = `if(!skipMessageValidation) {
    const {valid, errors} = ${messageModule ?? messageType}.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      ${onValidationFail}
    }
  }`;
  }
  return {
    potentialValidatorCreation: validatorCreation,
    potentialValidationFunction: validationFunction
  };
}

/**
 * Collects all payload, parameter, and header imports for a specific protocol's dependencies.
 * This should be called once per protocol to add the necessary imports.
 */
export function collectProtocolDependencies(
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType,
  headers: TypeScriptHeadersRenderType | undefined,
  context: TypeScriptChannelsContext,
  protocolDeps: string[]
) {
  // Add payload imports
  addPayloadsToDependencies(
    Object.values(payloads.operationModels),
    payloads.generator,
    context.generator,
    protocolDeps
  );
  addPayloadsToDependencies(
    Object.values(payloads.channelModels),
    payloads.generator,
    context.generator,
    protocolDeps
  );
  addPayloadsToDependencies(
    Object.values(payloads.otherModels),
    payloads.generator,
    context.generator,
    protocolDeps
  );

  // Add parameter imports
  addParametersToDependencies(
    parameters.channelModels,
    parameters.generator,
    context.generator,
    protocolDeps
  );

  // Add header imports
  if (headers) {
    addHeadersToDependencies(
      headers.channelModels,
      headers.generator,
      context.generator,
      protocolDeps
    );
  }
}
