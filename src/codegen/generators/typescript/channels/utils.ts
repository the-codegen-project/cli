import {
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {ChannelPayload} from '../../../types';
import path from 'node:path';
import {
  ensureRelativePath,
  appendImportExtension,
  ImportExtension
} from '../../../utils';
import {TypeScriptPayloadRenderType} from '../payloads';
import {TypeScriptParameterRenderType} from '../parameters';
import {TypeScriptHeadersRenderType} from '../headers';
import {TypeScriptChannelsContext} from './types';

export function addPayloadsToDependencies(
  models: ChannelPayload[],
  payloadGenerator: {outputPath: string},
  currentGenerator: {outputPath: string},
  dependencies: string[],
  importExtension: ImportExtension = 'none'
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
      const importPath = appendImportExtension(
        `./${ensureRelativePath(payloadImportPath)}`,
        importExtension
      );
      if (
        payload.messageModel.model instanceof ConstrainedObjectModel ||
        payload.messageModel.model instanceof ConstrainedEnumModel
      ) {
        dependencies.push(
          `import {${payload.messageModel.modelName}} from '${importPath}';`
        );
      } else {
        dependencies.push(
          `import * as ${payload.messageModel.modelName}Module from '${importPath}';`
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
  dependencies: string[],
  importExtension: ImportExtension = 'none'
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
      const importPath = appendImportExtension(
        `./${ensureRelativePath(parameterImportPath)}`,
        importExtension
      );

      dependencies.push(
        `import {${parameter.modelName}} from '${importPath}';`
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
  dependencies: string[],
  importExtension: ImportExtension = 'none'
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
      const importPath = appendImportExtension(
        `./${ensureRelativePath(headerImportPath)}`,
        importExtension
      );

      dependencies.push(`import {${header.modelName}} from '${importPath}';`);
    });
}
export function getMessageTypeAndModule(payload: ChannelPayload) {
  if (payload === undefined) {
    return {
      messageType: undefined,
      messageModule: undefined,
      includesStatusCodes: false
    };
  }
  let messageModule;
  if (!(payload.messageModel.model instanceof ConstrainedObjectModel)) {
    // Use modelName for module name since messageType may contain invalid identifier characters
    // (e.g., 'Pet[]' for array types). The import is generated using modelName, so we need to match.
    messageModule = `${payload.messageModel.modelName}Module`;
  }

  // Check if this payload has unmarshalByStatusCode support
  // This is set explicitly on the payload, or detected from the model's originalInput
  const includesStatusCodes =
    payload.includesStatusCodes ??
    payload.messageModel.model.originalInput?.[
      'x-modelina-has-status-codes'
    ] === true;

  return {messageType: payload.messageType, messageModule, includesStatusCodes};
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
  protocolDeps: string[],
  importExtension: ImportExtension = 'none'
) {
  // Add payload imports
  addPayloadsToDependencies(
    Object.values(payloads.operationModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );
  addPayloadsToDependencies(
    Object.values(payloads.channelModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );
  addPayloadsToDependencies(
    Object.values(payloads.otherModels),
    payloads.generator,
    context.generator,
    protocolDeps,
    importExtension
  );

  // Add parameter imports
  addParametersToDependencies(
    parameters.channelModels,
    parameters.generator,
    context.generator,
    protocolDeps,
    importExtension
  );

  // Add header imports
  if (headers) {
    addHeadersToDependencies(
      headers.channelModels,
      headers.generator,
      context.generator,
      protocolDeps,
      importExtension
    );
  }
}

/**
 * Escapes special characters in description for JSDoc.
 * Handles closing comment markers and formats multi-line descriptions.
 */
export function escapeJSDocDescription(description: string): string {
  if (!description) {
    return '';
  }
  return description
    .replace(/\*\//g, '*\u2215') // Escape closing comment (use division slash)
    .replace(/\n/g, '\n * '); // Format multi-line with JSDoc prefix
}

/**
 * Renders JSDoc block for channel functions.
 * Uses operation description from API spec when available, falls back to generic text.
 */
export function renderChannelJSDoc(params: {
  description?: string;
  deprecated?: boolean;
  fallbackDescription: string;
  parameters?: Array<{name: string; jsDoc: string}>;
}): string {
  const {
    description,
    deprecated,
    fallbackDescription,
    parameters = []
  } = params;

  const desc = description
    ? escapeJSDocDescription(description)
    : fallbackDescription;

  const parts = ['/**', ` * ${desc}`];

  if (deprecated) {
    parts.push(' *');
    parts.push(' * @deprecated');
  }

  if (parameters.length > 0) {
    parts.push(' *');
    parameters.forEach((p) => parts.push(p.jsDoc));
  }

  parts.push(' */');

  return parts.join('\n');
}
