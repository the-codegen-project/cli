/* eslint-disable security/detect-object-injection */
/* eslint-disable sonarjs/no-duplicate-string */
/**
 * TypeScript channels generator.
 *
 * Iterates `ChannelGeneratorInput.channels` and dispatches each
 * channel to every configured protocol that the channel supports.
 * The walker is fully input-format-agnostic: producers normalize
 * AsyncAPI/OpenAPI/EventCatalog channel data into `ChannelInfo`,
 * and protocol generators consume `ChannelInfo` directly.
 */
import {TheCodegenConfiguration, GeneratedFile} from '../../../types';
import {
  appendImportExtension,
  resolveImportExtension,
  joinPath
} from '../../../utils';
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
  ChannelFunctionTypes,
  TypeScriptChannelsGeneratorContext,
  SupportedProtocols
} from './types';
import {ChannelInfo} from './input';
import {OutputModel, ConstrainedObjectModel} from '@asyncapi/modelina';
import {collectProtocolDependencies} from './utils';
import {generateNatsChannels} from './protocols/nats';
import {generateKafkaChannels} from './protocols/kafka';
import {generateMqttChannels} from './protocols/mqtt';
import {generateAmqpChannels} from './protocols/amqp';
import {generateEventSourceChannels} from './protocols/eventsource';
import {generatehttpChannels, renderHttpCommonTypes} from './protocols/http';
import {generateWebSocketChannels} from './protocols/websocket';
import {createMissingParameterError} from '../../../errors';

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

/**
 * Walk every (channel, protocol) pair and invoke the matching protocol
 * generator. Channels that don't list a protocol in their `protocols`
 * field are skipped for that protocol.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function generateTypeScriptChannels(
  context: TypeScriptChannelsContext
): Promise<TypeScriptChannelRenderType> {
  const {input, generator, securitySchemes} = context;
  const protocolCodeFunctions: Record<string, string[]> = {};
  const externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  > = {};

  const {parameters, payloads, headers} = validateContext(context);

  const protocolsToUse = generator.protocols;
  const protocolDependencies: Record<string, string[]> = {};
  for (const protocol of protocolsToUse) {
    protocolCodeFunctions[protocol] = [];
    externalProtocolFunctionInformation[protocol] = [];
    protocolDependencies[protocol] = [];
  }

  // Collect payload/parameter/header imports for each protocol once.
  const importExtension = resolveImportExtension(
    context.generator,
    context.config
  );
  for (const protocol of protocolsToUse) {
    const deps = protocolDependencies[protocol];
    collectProtocolDependencies(
      payloads,
      parameters,
      headers,
      context,
      deps,
      importExtension
    );
  }

  // For HTTP-only flows (e.g. OpenAPI input), prepend common types
  // before any HTTP renders. Match the pre-refactor behavior of the
  // OpenAPI dispatch path which pre-loaded `renderHttpCommonTypes`
  // with the security-scheme-derived auth helpers.
  if (
    protocolsToUse.includes('http_client') &&
    securitySchemes.length > 0 &&
    input.channels.length > 0
  ) {
    const commonTypesCode = renderHttpCommonTypes(securitySchemes);
    protocolCodeFunctions['http_client'].unshift(commonTypesCode);
  }

  for (const channel of input.channels) {
    // Always try the parameter lookup; only throw when the channel
    // declared parameters but the model is missing (matches AsyncAPI's
    // pre-refactor invariant).
    const parameter: OutputModel | undefined =
      parameters.channelModels[channel.id];
    if (channel.hasParameters && parameter === undefined) {
      throw createMissingParameterError({
        channelOrOperation: channel.id,
        protocol: 'channels'
      });
    }
    const headerModel: OutputModel | undefined =
      headers.channelModels[channel.id];

    for (const protocol of protocolsToUse) {
      if (!channel.protocols.includes(protocol)) {
        continue;
      }
      const protocolContext: TypeScriptChannelsGeneratorContext = {
        ...context,
        subName: channel.subName,
        topic: channel.address,
        parameter: parameter?.model as ConstrainedObjectModel,
        headers: headerModel?.model as ConstrainedObjectModel,
        payloads
      };

      await dispatchProtocol(
        protocol,
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies
      );
    }
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

async function dispatchProtocol(
  protocol: SupportedProtocols,
  protocolContext: TypeScriptChannelsGeneratorContext,
  channel: ChannelInfo,
  protocolCodeFunctions: Record<string, string[]>,
  externalProtocolFunctionInformation: Record<
    string,
    TypeScriptChannelRenderedFunctionType[]
  >,
  protocolDependencies: Record<string, string[]>
): Promise<void> {
  switch (protocol) {
    case 'nats':
      await generateNatsChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['nats']
      );
      break;
    case 'kafka':
      await generateKafkaChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['kafka']
      );
      break;
    case 'mqtt':
      await generateMqttChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['mqtt']
      );
      break;
    case 'amqp':
      await generateAmqpChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['amqp']
      );
      break;
    case 'http_client':
      await generatehttpChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['http_client']
      );
      break;
    case 'event_source':
      await generateEventSourceChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['event_source']
      );
      break;
    case 'websocket':
      await generateWebSocketChannels(
        protocolContext,
        channel,
        protocolCodeFunctions,
        externalProtocolFunctionInformation,
        protocolDependencies['websocket']
      );
      break;
    default:
      break;
  }
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

  // Generate index.ts with namespace re-exports
  let indexContent: string;
  if (generatedProtocols.length > 0) {
    const ext = resolveImportExtension(context.generator, context.config);
    const imports = generatedProtocols
      .map((p) => {
        const importPath = appendImportExtension(`./${p}`, ext);
        return `import * as ${p} from '${importPath}';`;
      })
      .join('\n');
    const exports = generatedProtocols.join(', ');
    indexContent = `${imports}\n\nexport {${exports}};\n`;
  } else {
    indexContent = '// No protocols generated\n';
  }

  const indexFilePath = joinPath(context.generator.outputPath, 'index.ts');
  files.push({path: indexFilePath, content: indexContent});

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
