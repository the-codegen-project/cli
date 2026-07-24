/* eslint-disable no-unused-expressions */
/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
import {TheCodegenConfiguration, GeneratedFile} from '../../../types';
import {resolveImportExtension, joinPath} from '../../../utils';
import {Logger} from '../../../../LoggingInterface';
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
  TypeScriptHeadersRenderType,
  TypescriptHeadersGenerator,
  defaultTypeScriptHeadersOptions
} from '../headers';
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
import {generateTypeScriptChannelsForAsyncAPI} from './asyncapi';
import {generateTypeScriptChannelsForOpenAPI} from './openapi';
import {renderChannelIndex} from './utils';
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
  const externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  > = {};

  const {parameters, payloads, headers} = validateContext(context);
  const generator = context.generator;

  const protocolsToUse = generator.protocols;
  const protocolDependencies: Record<string, string[]> = {};
  for (const protocol of protocolsToUse) {
    protocolCodeFunctions[protocol] = [];
    externalProtocolFunctionInformation[protocol] = [];
    protocolDependencies[protocol] = [];
  }
  if (context.inputType === 'asyncapi') {
    await generateTypeScriptChannelsForAsyncAPI(
      context,
      parameters,
      payloads,
      headers,
      protocolsToUse,
      protocolCodeFunctions,
      externalProtocolFunctionInformation,
      protocolDependencies
    );
  } else if (context.inputType === 'openapi') {
    await generateTypeScriptChannelsForOpenAPI(
      context,
      parameters,
      payloads,
      headers,
      protocolsToUse,
      protocolCodeFunctions,
      externalProtocolFunctionInformation,
      protocolDependencies
    );
  }

  return await finalizeGeneration(
    context,
    protocolDependencies,
    protocolCodeFunctions,
    externalProtocolFunctionInformation,
    parameters,
    payloads
  );
}

async function finalizeGeneration(
  context: TypeScriptChannelsContext,
  protocolDependencies: Record<string, string[]>,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  parameters: TypeScriptParameterRenderType,
  payloads: TypeScriptPayloadRenderType
): Promise<TypeScriptChannelRenderType> {
  const files: GeneratedFile[] = [];
  const generatedProtocols: string[] = [];
  const protocolFiles: Record<string, string> = {};

  // Generate one file per protocol
  for (const [protocol, functions] of Object.entries(protocolCodeFunctions)) {
    if (functions.length === 0) {
      continue;
    }

    const deps = [...new Set(protocolDependencies[protocol] || [])];

    // Get function names for the export statement
    const functionNames = (
      externalProtocolFunctionInformation[protocol] || []
    ).map((fn) => fn.functionName);

    // Functions are defined first, then exported by name at the end
    const depsSection = deps.join('\n');
    const depsNewline = deps.length > 0 ? '\n\n' : '';
    const functionsSection = functions.join('\n\n');
    const exportSection =
      functionNames.length > 0
        ? `\n\nexport { ${functionNames.join(', ')} };`
        : '';
    const fileContent = `${depsSection}${depsNewline}${functionsSection}${exportSection}\n`;

    const protocolFilePath = joinPath(
      context.generator.outputPath,
      `${protocol}.ts`
    );
    files.push({path: protocolFilePath, content: fileContent});

    generatedProtocols.push(protocol);
    protocolFiles[protocol] = fileContent;
  }

  // Generate index.ts. The per-protocol `<protocol>.ts` files are identical
  // across every organization style — only this barrel changes shape.
  const indexContent = renderChannelIndex({
    generatedProtocols,
    externalProtocolFunctionInformation,
    organization: context.generator.organization,
    importExtension: resolveImportExtension(context.generator, context.config)
  });

  const indexFilePath = joinPath(context.generator.outputPath, 'index.ts');
  files.push({path: indexFilePath, content: indexContent});

  // No protocol produced any functions — the barrel is still emitted (the
  // content contract is unchanged), but warn so the user knows nothing usable
  // was generated and how to fix it.
  if (generatedProtocols.length === 0) {
    Logger.warn(
      `Channels generator '${context.generator.id}' produced no protocol functions. Set 'protocols' (e.g. nats, kafka, mqtt, amqp, http_client, websocket, event_source) in the generator configuration to generate channel functions.`
    );
  }

  return {
    parameterRender: parameters,
    payloadRender: payloads,
    generator: context.generator,
    renderedFunctions: externalProtocolFunctionInformation,
    result: indexContent,
    protocolFiles,
    files
  };
}

function validateContext(context: TypeScriptChannelsContext): {
  payloads: TypeScriptPayloadRenderType;
  parameters: TypeScriptParameterRenderType;
  headers: TypeScriptHeadersRenderType;
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
  const headers = context.dependencyOutputs[
    generator.headerGeneratorId
  ] as TypeScriptHeadersRenderType;
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
  if (!headers) {
    throw new Error(
      'Internal error, could not determine previous rendered headers generator that is required for channel TypeScript generator'
    );
  }
  return {payloads, parameters, headers};
}

/**
 * Make sure we include all dependencies, if not added manually, is added to the generators.
 */
export function includeTypeScriptChannelDependencies(
  config: TheCodegenConfiguration,
  generator: TypeScriptChannelsGenerator
) {
  const newGenerators: unknown[] = [];
  const parameterGeneratorId = generator.parameterGeneratorId;
  const payloadGeneratorId = generator.payloadGeneratorId;
  const headerGeneratorId = generator.headerGeneratorId;
  const hasParameterGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === parameterGeneratorId
    ) !== undefined;
  const hasPayloadGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === payloadGeneratorId
    ) !== undefined;
  const hasHeaderGenerator =
    config.generators.find(
      (generatorSearch) => generatorSearch.id === headerGeneratorId
    ) !== undefined;
  if (!hasParameterGenerator) {
    const defaultChannelParameterGenerator: TypescriptParametersGenerator = {
      ...defaultTypeScriptParametersOptions,
      outputPath: joinPath(generator.outputPath ?? '', './parameter')
    };
    newGenerators.push(defaultChannelParameterGenerator);
  }
  if (!hasPayloadGenerator) {
    const defaultChannelPayloadGenerator: TypeScriptPayloadGenerator = {
      ...defaultTypeScriptPayloadGenerator,
      outputPath: joinPath(generator.outputPath ?? '', './payload')
    };
    newGenerators.push(defaultChannelPayloadGenerator);
  }
  if (!hasHeaderGenerator) {
    const defaultChannelHeaderGenerator: TypescriptHeadersGenerator = {
      ...defaultTypeScriptHeadersOptions,
      outputPath: joinPath(generator.outputPath ?? '', './headers')
    };
    newGenerators.push(defaultChannelHeaderGenerator);
  }
  return newGenerators;
}
