import {ConstrainedObjectModel, OutputModel} from '@asyncapi/modelina';
import {ChannelPayload} from '../../../types';
import path from 'node:path';
import {ensureRelativePath} from '../../../utils';

export function addPayloadsToDependencies(
  models: ChannelPayload[],
  payloadGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[]
) {
  models.forEach((payload) => {
    const payloadImportPath = path.relative(
      currentGenerator.outputPath,
      path.resolve(payloadGenerator.outputPath, payload.messageModel.modelName)
    );
    if (payload.messageModel.model instanceof ConstrainedObjectModel) {
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
  models.forEach((payload) => {
    if (payload.messageModel.model instanceof ConstrainedObjectModel) {
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
export function getMessageTypeAndModule(payload: ChannelPayload) {
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
    validatorCreation = `const validator = ${messageModule ? messageModule : messageType}.createValidator();`;
    validationFunction = `if(skipMessageValidation: boolean = false) {
    const {valid, errors} = ${messageModule ? messageModule : messageType}.validate({data: receivedData, ajvValidatorFunction: validator});
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
