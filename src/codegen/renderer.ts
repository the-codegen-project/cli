import {Logger} from '../LoggingInterface';
import {
  GenerationResult,
  GeneratorResult,
  Generators,
  GeneratorsInternal,
  RenderTypes,
  RunGeneratorContext,
  GeneratedFile
} from './types';
import {
  generateTypeScriptChannels,
  generateTypeScriptClient,
  generateTypescriptParameters,
  generateTypescriptPayload,
  generateTypescriptHeaders,
  generateTypescriptTypes,
  CustomGeneratorInternal
} from './generators';
import path from 'path';
import Graph from 'graphology';
import {findDuplicatesInArray} from './utils';
import {generateTypescriptModels} from './generators/typescript/models';
import {
  createUnsupportedLanguageError,
  createUnsupportedPresetForInputError,
  createDuplicateGeneratorIdError,
  createCircularDependencyError,
  createMissingInputDocumentError
} from './errors';
import {produceAsyncAPIPayloadInput} from './inputs/asyncapi/producers/payloads';
import {produceOpenAPIPayloadInput} from './inputs/openapi/producers/payloads';
import {PayloadGeneratorInput} from './generators/typescript/payloads.input';
import {produceAsyncAPIHeadersInput} from './inputs/asyncapi/producers/headers';
import {produceOpenAPIHeadersInput} from './inputs/openapi/producers/headers';
import {HeadersGeneratorInput} from './generators/typescript/headers.input';
import {produceAsyncAPIParameterInput} from './inputs/asyncapi/producers/parameters';
import {produceOpenAPIParameterInput} from './inputs/openapi/producers/parameters';
import {ParameterGeneratorInput} from './generators/typescript/parameters.input';
import {produceAsyncAPIModelsInput} from './inputs/asyncapi/producers/models';
import {produceOpenAPIModelsInput} from './inputs/openapi/producers/models';
import {produceJsonSchemaModelsInput} from './inputs/jsonschema/producers/models';
import {ModelsGeneratorInput} from './generators/typescript/models.input';
import {produceAsyncAPITypesInput} from './inputs/asyncapi/producers/types';
import {produceOpenAPITypesInput} from './inputs/openapi/producers/types';
import {TypesGeneratorInput} from './generators/typescript/types.input';
import {produceAsyncAPIChannelInput} from './inputs/asyncapi/producers/channels';
import {produceOpenAPIChannelInput} from './inputs/openapi/producers/channels';
import {ChannelGeneratorInput} from './generators/typescript/channels/input';
import {
  extractSecuritySchemes,
  SecuritySchemeOptions
} from './inputs/openapi/security';
import {ClientGeneratorInput} from './generators/typescript/client/input';
import {
  CustomGeneratorInput,
  CustomGeneratorInputType,
  CustomGeneratorRawDocuments,
  CustomGeneratorTypedInputs
} from './generators/generic/custom.input';
import {produceEventCatalogPayloadInput} from './inputs/eventcatalog/producers/payloads';
import {produceEventCatalogParameterInput} from './inputs/eventcatalog/producers/parameters';
import {produceEventCatalogHeadersInput} from './inputs/eventcatalog/producers/headers';
import {produceEventCatalogTypesInput} from './inputs/eventcatalog/producers/types';
import {produceEventCatalogChannelInput} from './inputs/eventcatalog/producers/channels';
import {produceEventCatalogModelsInput} from './inputs/eventcatalog/producers/models';

export type Node = {
  generator: Generators;
};
type GraphType = Graph<Node>;

/**
 * AJV vocabularies that need to be registered for the configured
 * input type. OpenAPI schemas commonly use `xml` and `example`
 * keywords; AJV strict mode rejects unknown keywords unless they're
 * registered. The producer/dispatch level is the only place that
 * knows the input type — the typed flag is forwarded to the
 * validation preset via the generator context.
 */
function validationVocabulariesFor(inputType: string): string[] | undefined {
  switch (inputType) {
    case 'openapi':
      return ['xml', 'example'];
    default:
      return undefined;
  }
}

/**
 * Dispatch the payloads producer for the configured input type. The
 * resulting `PayloadGeneratorInput` is consumed by the payloads
 * generator without further input-format awareness.
 */
async function producePayloadInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): Promise<PayloadGeneratorInput> {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'payloads'
        });
      }
      return produceAsyncAPIPayloadInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'payloads'
        });
      }
      return produceOpenAPIPayloadInput(openapiDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'payloads'
        });
      }
      return produceEventCatalogPayloadInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'payloads',
        inputType,
        supportedPresets: []
      });
  }
}

/**
 * Dispatch the models producer for the configured input type. The
 * `models` generator is one of the two documented exceptions where
 * the input is a typed envelope over the source document — Modelina
 * IS the extractor.
 */
function produceModelsInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  jsonSchemaDocument: RunGeneratorContext['jsonSchemaDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): ModelsGeneratorInput {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'models'
        });
      }
      return produceAsyncAPIModelsInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'models'
        });
      }
      return produceOpenAPIModelsInput(openapiDocument);
    }
    case 'jsonschema': {
      if (!jsonSchemaDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'jsonschema',
          generatorPreset: 'models'
        });
      }
      return produceJsonSchemaModelsInput(jsonSchemaDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'models'
        });
      }
      return produceEventCatalogModelsInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'models',
        inputType,
        supportedPresets: []
      });
  }
}

/**
 * Dispatch the parameters producer for the configured input type.
 */
async function produceParameterInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): Promise<ParameterGeneratorInput> {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'parameters'
        });
      }
      return produceAsyncAPIParameterInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'parameters'
        });
      }
      return produceOpenAPIParameterInput(openapiDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'parameters'
        });
      }
      return produceEventCatalogParameterInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'parameters',
        inputType,
        supportedPresets: []
      });
  }
}

/**
 * Build the full `CustomGeneratorInput` passed to a user-supplied
 * `renderFunction`. Runs every available built-in producer for the
 * configured input type and collects the raw source documents.
 *
 * Producers that require a missing document return an empty IR
 * (e.g. JSON Schema → `channels: []`) rather than throwing — custom
 * generators should be able to introspect what's available and pick
 * the layer that fits their needs.
 */
async function produceCustomGeneratorInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  jsonSchemaDocument: RunGeneratorContext['jsonSchemaDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog'],
  dependencyOutputs: Record<string, unknown>,
  generator: GeneratorsInternal
): Promise<CustomGeneratorInput> {
  const inputs: CustomGeneratorTypedInputs = {
    payloads: {channelPayloads: {}, operationPayloads: {}, otherPayloads: []},
    parameters: {channelParameters: {}},
    headers: {channelHeaders: {}},
    types: {outputStyle: 'topics', emitIds: false, addresses: []},
    channels: {channels: []},
    client: {channels: [], securitySchemes: []},
    models: {}
  };

  if (parsedEventCatalog) {
    inputs.payloads = await produceEventCatalogPayloadInput(parsedEventCatalog);
    inputs.parameters =
      await produceEventCatalogParameterInput(parsedEventCatalog);
    inputs.headers = produceEventCatalogHeadersInput(parsedEventCatalog);
    inputs.types = produceEventCatalogTypesInput(parsedEventCatalog);
    inputs.channels = produceEventCatalogChannelInput(parsedEventCatalog);
    inputs.client = {
      channels: inputs.channels.channels,
      securitySchemes: parsedEventCatalog.openapi
        ? extractSecuritySchemes(parsedEventCatalog.openapi)
        : []
    };
    inputs.models = produceEventCatalogModelsInput(parsedEventCatalog);
  } else if (asyncapiDocument) {
    inputs.payloads = await produceAsyncAPIPayloadInput(asyncapiDocument);
    inputs.parameters = await produceAsyncAPIParameterInput(asyncapiDocument);
    inputs.headers = produceAsyncAPIHeadersInput(asyncapiDocument);
    inputs.types = produceAsyncAPITypesInput(asyncapiDocument);
    inputs.channels = produceAsyncAPIChannelInput(asyncapiDocument);
    inputs.client = {
      channels: inputs.channels.channels,
      securitySchemes: []
    };
    inputs.models = produceAsyncAPIModelsInput(asyncapiDocument);
  } else if (openapiDocument) {
    inputs.payloads = produceOpenAPIPayloadInput(openapiDocument);
    inputs.parameters = produceOpenAPIParameterInput(openapiDocument);
    inputs.headers = produceOpenAPIHeadersInput(openapiDocument);
    inputs.types = produceOpenAPITypesInput(openapiDocument);
    inputs.channels = produceOpenAPIChannelInput(openapiDocument);
    inputs.client = {
      channels: inputs.channels.channels,
      securitySchemes: extractSecuritySchemes(openapiDocument)
    };
    inputs.models = produceOpenAPIModelsInput(openapiDocument);
  } else if (jsonSchemaDocument) {
    inputs.models = produceJsonSchemaModelsInput(jsonSchemaDocument);
  }

  const rawDocuments: CustomGeneratorRawDocuments = {
    asyncapi: asyncapiDocument,
    openapi: openapiDocument,
    jsonSchema: jsonSchemaDocument,
    eventCatalog: parsedEventCatalog
  };

  return {
    inputs,
    rawDocuments,
    inputType: inputType as CustomGeneratorInputType,
    generator,
    dependencyOutputs
  };
}

/**
 * Dispatch the channels producer for the configured input type. The
 * resulting `ChannelGeneratorInput` is consumed by the channels
 * generator without input-format awareness.
 */
function produceChannelInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): ChannelGeneratorInput {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'channels'
        });
      }
      return produceAsyncAPIChannelInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'channels'
        });
      }
      return produceOpenAPIChannelInput(openapiDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'channels'
        });
      }
      return produceEventCatalogChannelInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'channels',
        inputType,
        supportedPresets: []
      });
  }
}

/**
 * Extract security schemes for the configured input type. Only OpenAPI
 * supplies schemes today; AsyncAPI returns an empty list.
 */
function extractSecuritySchemesFor(
  inputType: string,
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): SecuritySchemeOptions[] {
  if (inputType === 'openapi' && openapiDocument) {
    return extractSecuritySchemes(openapiDocument);
  }
  if (inputType === 'eventcatalog' && parsedEventCatalog?.openapi) {
    return extractSecuritySchemes(parsedEventCatalog.openapi);
  }
  return [];
}

/**
 * Dispatch the types producer for the configured input type.
 */
function produceTypesInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): TypesGeneratorInput {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'types'
        });
      }
      return produceAsyncAPITypesInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'types'
        });
      }
      return produceOpenAPITypesInput(openapiDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'types'
        });
      }
      return produceEventCatalogTypesInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'types',
        inputType,
        supportedPresets: []
      });
  }
}

/**
 * Dispatch the headers producer for the configured input type.
 */
function produceHeadersInput(
  inputType: string,
  asyncapiDocument: RunGeneratorContext['asyncapiDocument'],
  openapiDocument: RunGeneratorContext['openapiDocument'],
  parsedEventCatalog: RunGeneratorContext['parsedEventCatalog']
): HeadersGeneratorInput {
  switch (inputType) {
    case 'asyncapi': {
      if (!asyncapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'asyncapi',
          generatorPreset: 'headers'
        });
      }
      return produceAsyncAPIHeadersInput(asyncapiDocument);
    }
    case 'openapi': {
      if (!openapiDocument) {
        throw createMissingInputDocumentError({
          expectedType: 'openapi',
          generatorPreset: 'headers'
        });
      }
      return produceOpenAPIHeadersInput(openapiDocument);
    }
    case 'eventcatalog': {
      if (!parsedEventCatalog) {
        throw createMissingInputDocumentError({
          expectedType: 'eventcatalog',
          generatorPreset: 'headers'
        });
      }
      return produceEventCatalogHeadersInput(parsedEventCatalog);
    }
    default:
      throw createUnsupportedPresetForInputError({
        preset: 'headers',
        inputType,
        supportedPresets: []
      });
  }
}

//eslint-disable-next-line sonarjs/cognitive-complexity
export async function renderGenerator(
  generator: GeneratorsInternal,
  context: RunGeneratorContext,
  renderedContext: Record<string, unknown>
): Promise<RenderTypes> {
  const {
    configuration,
    asyncapiDocument,
    openapiDocument,
    jsonSchemaDocument,
    parsedEventCatalog,
    configFilePath
  } = context;
  const outputPath = path.resolve(
    path.dirname(configFilePath),
    generator.outputPath ?? ''
  );
  const language = generator.language
    ? generator.language
    : configuration.language;
  Logger.debug(
    `Generator ${generator.id}: outputPath=${outputPath}, language=${language}, preset=${generator.preset}`
  );
  // Check if this generator is compatible with the input type
  if (
    configuration.inputType === 'jsonschema' &&
    generator.preset !== 'models' &&
    generator.preset !== 'custom'
  ) {
    throw createUnsupportedPresetForInputError({
      preset: generator.preset,
      inputType: 'jsonschema',
      supportedPresets: ['models', 'custom']
    });
  }

  switch (generator.preset) {
    case 'payloads': {
      switch (language) {
        case 'typescript': {
          const payloadInput = await producePayloadInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          return generateTypescriptPayload({
            input: payloadInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            validationVocabularies: validationVocabulariesFor(
              configuration.inputType as string
            ),
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'payloads',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'parameters': {
      switch (language) {
        case 'typescript': {
          const parameterInput = await produceParameterInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          return generateTypescriptParameters({
            input: parameterInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'parameters',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'headers': {
      switch (language) {
        case 'typescript': {
          const headersInput = produceHeadersInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          return generateTypescriptHeaders({
            input: headersInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            validationVocabularies: validationVocabulariesFor(
              configuration.inputType as string
            ),
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'headers',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'types': {
      switch (language) {
        case 'typescript': {
          const typesInput = produceTypesInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          return generateTypescriptTypes({
            input: typesInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'types',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'channels': {
      switch (language) {
        case 'typescript': {
          const channelInput = produceChannelInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          return generateTypeScriptChannels({
            input: channelInput,
            securitySchemes: extractSecuritySchemesFor(
              configuration.inputType as string,
              openapiDocument,
              parsedEventCatalog
            ),
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'channels',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'client': {
      switch (language) {
        case 'typescript': {
          const clientInputData = produceChannelInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            parsedEventCatalog
          );
          const clientInput: ClientGeneratorInput = {
            channels: clientInputData.channels,
            securitySchemes: extractSecuritySchemesFor(
              configuration.inputType as string,
              openapiDocument,
              parsedEventCatalog
            )
          };
          return generateTypeScriptClient({
            input: clientInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'client',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'models': {
      switch (language) {
        case 'typescript': {
          const modelsInput = produceModelsInput(
            configuration.inputType as string,
            asyncapiDocument,
            openapiDocument,
            jsonSchemaDocument,
            parsedEventCatalog
          );
          return generateTypescriptModels({
            input: modelsInput,
            generator: {
              ...generator,
              outputPath
            },
            config: configuration,
            dependencyOutputs: renderedContext
          });
        }

        default: {
          throw createUnsupportedLanguageError({
            preset: 'models',
            language: language ?? 'unknown'
          });
        }
      }
    }

    case 'custom': {
      const customInput = await produceCustomGeneratorInput(
        configuration.inputType as string,
        asyncapiDocument,
        openapiDocument,
        jsonSchemaDocument,
        parsedEventCatalog,
        renderedContext,
        generator
      );
      return (generator as CustomGeneratorInternal).renderFunction(
        customInput,
        (generator as CustomGeneratorInternal).options
      );
    }
    // No default
  }
}

export function determineRenderGraph(context: RunGeneratorContext): GraphType {
  const {configuration} = context;
  const duplicateGenerators = findDuplicatesInArray(
    context.configuration.generators,
    'id'
  );
  if (duplicateGenerators.length > 0) {
    throw createDuplicateGeneratorIdError({duplicateIds: duplicateGenerators});
  }

  const graph = new Graph<Node>({allowSelfLoops: true, type: 'directed'});
  for (const generator of configuration.generators as Generators[]) {
    graph.addNode(generator.id, {generator});
  }
  for (const generator of configuration.generators as Generators[]) {
    for (const dependency of generator.dependencies ?? []) {
      graph.addDirectedEdge(dependency, generator.id);
    }
  }

  if (graph.selfLoopCount !== 0) {
    throw createCircularDependencyError();
  }

  return graph;
}

/**
 * Extract files from render result.
 * Generators now return `files: GeneratedFile[]` instead of `filesWritten: string[]`.
 */
function extractFilesFromResult(result: RenderTypes): GeneratedFile[] {
  // Type guard to check for files property
  if (
    result &&
    typeof result === 'object' &&
    'files' in result &&
    Array.isArray((result as {files: unknown}).files)
  ) {
    return (result as {files: GeneratedFile[]}).files;
  }
  return [];
}

/**
 * Recursively go over all nodes and render those that are ready to be rendered (no dependencies that have not been rendered) and recursively do it until no nodes are left
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function renderGraph(
  context: RunGeneratorContext,
  graph: GraphType
): Promise<GenerationResult> {
  const startTime = Date.now();
  const renderedContext: Record<string, unknown> = {};
  const generatorResults: GeneratorResult[] = [];

  const recursivelyRenderGenerators = async (
    nodesToRender: Array<{node: string; attributes: {generator: Generators}}>,
    previousCount?: number
  ) => {
    const count = nodesToRender.length;
    if (previousCount === count) {
      throw createCircularDependencyError();
    }

    const nodesToRenderNext: typeof nodesToRender = [];
    const alreadyRenderedNodes = Object.keys(renderedContext);
    for (const nodeEntry of nodesToRender) {
      const dependencies = graph.inEdgeEntries(nodeEntry.node);
      //check if all dependencies have been rendered, if not, wait until later
      let allRendered = true;
      for (const dependency of dependencies) {
        if (!alreadyRenderedNodes.includes(dependency.source)) {
          allRendered = false;
          break;
        }
      }

      if (allRendered) {
        const generatorStartTime = Date.now();
        const generator = nodeEntry.attributes.generator;
        Logger.updateSpinner(`Generating ${generator.preset}...`);
        const result = await renderGenerator(
          generator as GeneratorsInternal,
          context,
          renderedContext
        );
        renderedContext[nodeEntry.node] = result;

        // Extract files from result
        const files = extractFilesFromResult(result);

        // Record generator result with files
        generatorResults.push({
          id: generator.id!,
          preset: generator.preset!,
          files,
          duration: Date.now() - generatorStartTime
        });
      } else {
        nodesToRenderNext.push(nodeEntry);
      }
    }
    if (nodesToRenderNext.length > 0) {
      await recursivelyRenderGenerators(nodesToRenderNext, count);
    }
  };
  await recursivelyRenderGenerators([...graph.nodeEntries()]);

  // Collect all files (deduplicated by path)
  const allFilesMap = new Map<string, GeneratedFile>();
  for (const result of generatorResults) {
    for (const file of result.files) {
      // Later files with same path override earlier ones
      allFilesMap.set(file.path, file);
    }
  }
  const allFiles = Array.from(allFilesMap.values());

  return {
    generators: generatorResults,
    files: allFiles,
    totalDuration: Date.now() - startTime
  };
}
