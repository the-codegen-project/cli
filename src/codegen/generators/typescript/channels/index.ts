/* eslint-disable no-unused-expressions */
/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {TheCodegenConfiguration} from '../../../types';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  defaultTypeScriptParametersOptions,
  TypeScriptParameterRenderType,
  TypescriptParametersGenerator
} from '../parameters';
import {
  TypeScriptPayloadGenerator,
  TypeScriptPayloadRenderType,
  defaultTypeScriptPayloadGenerator
} from '../payloads';
import {
  TypeScriptChannelRenderedFunctionType,
  TypeScriptChannelRenderType,
  TypeScriptChannelsContext,
  TypeScriptChannelsGenerator,
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelsGeneratorInternal,
  zodTypescriptChannelsGenerator,
  ChannelFunctionTypes
} from './types';
import {addParametersToDependencies, addPayloadsToDependencies} from './utils';
import {generateTypeScriptChannelsForAsyncAPI} from '../../../inputs/asyncapi/generators/channels';
import {generateTypeScriptChannelsForOpenAPI} from '../../../inputs/openapi/generators/channels';
export {
  TypeScriptChannelRenderedFunctionType,
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
  const protocolCodeFunctions: Record<string, string[]> = {};

  // Render before renders
  const externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  > = {};

  const {parameters, payloads} = validateContext(context);
  const generator = context.generator;

  const protocolsToUse = generator.protocols;
  for (const protocol of protocolsToUse) {
    protocolCodeFunctions[protocol] = [];
    externalProtocolFunctionInformation[protocol] = [];
  }
  const dependencies: string[] = [];
  addDependencies(payloads, parameters, context, dependencies);
  if (context.inputType === 'asyncapi') {
    await generateTypeScriptChannelsForAsyncAPI(
      context,
      parameters,
      payloads,
      protocolsToUse,
      protocolCodeFunctions,
      externalProtocolFunctionInformation,
      dependencies
    );
  } else if (context.inputType === 'openapi') {
    await generateTypeScriptChannelsForOpenAPI({
      context,
      parameters,
      payloads,
      protocolsToUse,
      protocolCodeFunctions,
      externalProtocolFunctionInformation,
      dependencies
    });
  } else {
    throw new Error('Input type not supported');
  }

  return await finalizeGeneration(
    context,
    dependencies,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    parameters,
    payloads
  );
}

async function finalizeGeneration(
  context: TypeScriptChannelsContext,
  dependencies: string[],
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  parameters: TypeScriptParameterRenderType,
  payloads: TypeScriptPayloadRenderType
): Promise<TypeScriptChannelRenderType> {
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
    generator: context.generator,
    renderedFunctions: externalProtocolFunctionInformation,
    result
  };
}

function addDependencies(
  payloads: TypeScriptPayloadRenderType,
  parameters: TypeScriptParameterRenderType,
  context: TypeScriptChannelsContext,
  dependencies: string[]
) {
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
}

function validateContext(context: TypeScriptChannelsContext): {
  payloads: TypeScriptPayloadRenderType;
  parameters: TypeScriptParameterRenderType;
} {
  const {generator} = context;
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
  return {payloads, parameters};
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
