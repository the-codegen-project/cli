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
  await mkdir(context.generator.outputPath, {recursive: true});

  const generatedProtocols: string[] = [];
  const protocolFiles: Record<string, string> = {};

  // Write one file per protocol
  for (const [protocol, functions] of Object.entries(protocolCodeFunctions)) {
    if (functions.length === 0) {
      continue;
    }

    const deps = [...new Set(protocolDependencies[protocol] || [])];

    // Functions are now standalone exports (not object properties)
    const depsSection = deps.join('\n');
    const depsNewline = deps.length > 0 ? '\n\n' : '';
    const functionsSection = functions.map((fn) => `export ${fn}`).join('\n\n');
    const fileContent = `${depsSection}${depsNewline}${functionsSection}\n`;

    await writeFile(
      path.resolve(context.generator.outputPath, `${protocol}.ts`),
      fileContent,
      {}
    );

    generatedProtocols.push(protocol);
    protocolFiles[protocol] = fileContent;
  }

  // Write index.ts with namespace re-exports
  let indexContent: string;
  if (generatedProtocols.length > 0) {
    const imports = generatedProtocols
      .map((p) => `import * as ${p} from './${p}';`)
      .join('\n');
    const exports = generatedProtocols.join(', ');
    indexContent = `${imports}\n\nexport {${exports}};\n`;
  } else {
    indexContent = '// No protocols generated\n';
  }

  await writeFile(
    path.resolve(context.generator.outputPath, 'index.ts'),
    indexContent,
    {}
  );

  return {
    parameterRender: parameters,
    payloadRender: payloads,
    generator: context.generator,
    renderedFunctions: externalProtocolFunctionInformation,
    result: indexContent,
    protocolFiles
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
  const newGenerators: any[] = [];
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
  if (!hasHeaderGenerator) {
    const defaultChannelHeaderGenerator: TypescriptHeadersGenerator = {
      ...defaultTypeScriptHeadersOptions,
      outputPath: path.resolve(generator.outputPath ?? '', './headers')
    };
    newGenerators.push(defaultChannelHeaderGenerator);
  }
  return newGenerators;
}
