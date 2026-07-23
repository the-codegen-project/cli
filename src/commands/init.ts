/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-collapsible-if */
/* eslint-disable prefer-const */
import {Flags} from '@oclif/core';
import {writeFile} from 'node:fs/promises';
import path from 'path';
import YAML from 'yaml';
// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
const inquirer = require('inquirer');
import {
  defaultTypeScriptChannelsGenerator,
  defaultTypeScriptClientGenerator,
  defaultTypeScriptHeadersOptions,
  defaultTypeScriptModelsOptions,
  defaultTypeScriptParametersOptions,
  defaultTypeScriptPayloadGenerator,
  defaultTypeScriptTypesOptions
} from '../codegen/generators';
import {updateGitignore} from '../utils/gitignore';
import {trackEvent} from '../telemetry';
import {Logger} from '../LoggingInterface';
import {BaseCommand} from './base';

const ConfigOptions = ['esm', 'json', 'yaml', 'ts'] as const;
const LanguageOptions = ['typescript'] as const;
const InputTypeOptions = ['asyncapi', 'openapi', 'jsonschema'] as const;
/**
 * Protocols offered by the TypeScript `channels` generator. Mirrors the
 * `protocols` enum on the channels Zod schema
 * (`src/codegen/generators/typescript/channels/types.ts`).
 */
const ChannelProtocolOptions = [
  'nats',
  'kafka',
  'mqtt',
  'amqp',
  'event_source',
  'http_client',
  'websocket'
] as const;
const map = {
  inputFile: {
    description:
      'File path for the code generation input such as AsyncAPI document'
  },
  configName: {
    description:
      'The name to use for the configuration file (dont include file extension)',
    default: 'codegen'
  },
  outputDirectory: {
    description:
      'Output configuration location, path to where the configuration file should be located. If relative path, the current working directory of the terminal will be used'
  },
  configType: {
    description: `The type of configuration file. 'esm', 'ts' can do everything, 'json' and 'yaml' is more restrictive. Read more here: https://github.com/the-codegen-project/cli/blob/main/docs/configurations.md`,
    options: ConfigOptions,
    default: 'esm'
  }
};

/**
 * Which input types each generator preset offered by `init` supports.
 * Messaging/HTTP presets are AsyncAPI/OpenAPI only; `models` additionally
 * supports JSON Schema, which only exposes `models` (and `custom`).
 */
const GENERATOR_INPUT_SUPPORT = new Map<string, ReadonlyArray<string>>([
  ['payloads', ['asyncapi', 'openapi']],
  ['parameters', ['asyncapi', 'openapi']],
  ['headers', ['asyncapi', 'openapi']],
  ['channels', ['asyncapi', 'openapi']],
  ['client', ['asyncapi', 'openapi']],
  ['types', ['asyncapi', 'openapi']],
  ['models', ['asyncapi', 'openapi', 'jsonschema']]
]);

/**
 * Whether a generator preset can be produced for the given input type.
 */
function supportsGenerator(preset: string, inputType?: string): boolean {
  return (
    inputType !== undefined &&
    (GENERATOR_INPUT_SUPPORT.get(preset)?.includes(inputType) ?? false)
  );
}

/**
 * Whether the interactive `include-*` question for a preset should be asked.
 * Reads the effective language and input type from flags first, falling back to
 * the answers collected so far — so a value supplied by flag is honoured even
 * though its own question was skipped (the previous predicate read only
 * `answers`, which silently dropped flag-driven includes).
 */
export function shouldAskInclude({
  preset,
  flags,
  answers
}: {
  preset: string;
  flags: {languages?: string; inputType?: string};
  answers: {languages?: string; inputType?: string};
}): boolean {
  const languages = flags.languages ?? answers.languages;
  const inputType = flags.inputType ?? answers.inputType;
  return languages === 'typescript' && supportsGenerator(preset, inputType);
}

/**
 * Collect the `.gitignore` entries from the generators that were actually built,
 * rather than from the raw include flags — an include flag that fails
 * `supportsGenerator` produces no generator and therefore no ignore entry.
 */
export function deriveGitignoreOutputPaths(
  generators: Array<{outputPath?: string}>
): string[] {
  return generators
    .map((generator) => generator.outputPath)
    .filter((outputPath): outputPath is string => typeof outputPath === 'string');
}

/**
 * Build the oclif relationships that gate an `include-*` flag to TypeScript
 * and an input type the preset actually supports.
 */
function includeGeneratorRelationships(preset: string): any {
  return [
    {
      flags: [
        {
          name: 'languages',
          when: async (flags: any) => flags['languages'] === 'typescript'
        },
        {
          name: 'input-type',
          when: async (flags: any) =>
            supportsGenerator(preset, flags['input-type'])
        }
      ],
      type: 'all'
    }
  ];
}

interface FlagTypes {
  inputFile: string;
  inputType: string;
  configName: string;
  configType: (typeof ConfigOptions)[number];
  outputDirectory: string;
  includePayloads: boolean;
  includeParameters: boolean;
  includeChannels: boolean;
  includeClient: boolean;
  includeHeaders: boolean;
  includeTypes: boolean;
  includeModels: boolean;
  channelsProtocols?: (typeof ChannelProtocolOptions)[number][];
  languages: (typeof LanguageOptions)[number];
  noOutput: boolean;
  gitignoreGenerated: boolean;
}

interface InquirerAnswers {
  configName?: string;
  inputFile?: string;
  inputType?: (typeof InputTypeOptions)[number];
  configType?: (typeof ConfigOptions)[number];
  languages?: (typeof LanguageOptions)[number];
  includeClient?: boolean;
  includePayloads?: boolean;
  includeHeaders?: boolean;
  includeParameters?: boolean;
  includeChannels?: boolean;
  includeTypes?: boolean;
  includeModels?: boolean;
  channelsProtocols?: (typeof ChannelProtocolOptions)[number][];
  gitignoreGenerated?: boolean;
}
export default class Init extends BaseCommand {
  static hidden = false;
  static description = 'Initialize The Codegen Project in your project';
  static args = {};

  static flags = {
    help: Flags.help(),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output'
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Only show errors and warnings'
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output'
    }),
    'input-file': Flags.file({
      description: map.inputFile.description
    }),
    'config-name': Flags.file({
      description: map.configName.description,
      default: map.configName.default
    }),
    'input-type': Flags.string({
      description: 'Input file type',
      options: [...InputTypeOptions]
    }),
    'output-directory': Flags.string({
      description: map.outputDirectory.description,
      default: './'
    }),
    'config-type': Flags.string({
      description: map.configType.description,
      options: map.configType.options,
      default: map.configType.default
    }),
    languages: Flags.string({
      description: 'Which languages do you wish to generate code for?',
      options: LanguageOptions,
      default: 'typescript'
    }),
    'channels-protocols': Flags.string({
      description:
        'Which protocols to generate channel functions for (used with --include-channels/--include-client on AsyncAPI inputs). Repeatable.',
      options: [...ChannelProtocolOptions],
      multiple: true
    }),
    'no-tty': Flags.boolean({
      description: 'Do not use an interactive terminal'
    }),
    'include-payloads': Flags.boolean({
      description: 'Include payloads generation, available for TypeScript',
      relationships: includeGeneratorRelationships('payloads')
    }),
    'include-headers': Flags.boolean({
      description: 'Include headers generation, available for TypeScript',
      relationships: includeGeneratorRelationships('headers')
    }),
    'include-client': Flags.boolean({
      description: 'Include client generation, available for TypeScript',
      relationships: includeGeneratorRelationships('client')
    }),
    'include-parameters': Flags.boolean({
      description: 'Include parameters generation, available for TypeScript',
      relationships: includeGeneratorRelationships('parameters')
    }),
    'include-channels': Flags.boolean({
      description: 'Include channels generation, available for TypeScript',
      relationships: includeGeneratorRelationships('channels')
    }),
    'include-types': Flags.boolean({
      description: 'Include types generation, available for TypeScript',
      relationships: includeGeneratorRelationships('types')
    }),
    'include-models': Flags.boolean({
      description: 'Include models generation, available for TypeScript',
      relationships: includeGeneratorRelationships('models')
    }),
    'no-output': Flags.boolean({
      description: 'For testing only, ignore',
      hidden: true
    }),
    'gitignore-generated': Flags.boolean({
      description: 'Add generated output directories to .gitignore'
    })
  };

  async run() {
    const {flags, metadata} = await this.parse(Init);

    // Configure logger based on flags
    this.setupLogger(flags);

    // eslint-disable-next-line no-undef
    const isTTY = process.stdout.isTTY;
    const realizedFlags = this.realizeFlags(flags);
    // `config-type` has a default, so its value is always present; use the
    // parser metadata to tell an explicit `--config-type` from the default so
    // the interactive prompt can respect an explicitly-passed flag.
    const configTypeIsDefault = Boolean(
      metadata.flags['config-type']?.setFromDefault
    );

    if (!flags['no-tty'] && isTTY) {
      return this.runInteractive(realizedFlags, {configTypeIsDefault});
    }

    await this.createConfiguration(realizedFlags);
  }

  realizeConfigFile(flags: FlagTypes) {
    // eslint-disable-next-line no-undef
    const processCurrentDir = process.cwd();
    return path.resolve(
      processCurrentDir,
      flags.outputDirectory!,
      `${flags.configName}.${flags.configType}`
    );
  }
  realizeFlags(flags: any): FlagTypes {
    const inputFile = flags['input-file'];
    const inputType = flags['input-type'];
    const configName = flags['config-name'];
    const configType = flags['config-type'];
    const outputDirectory = flags['output-directory'];
    const includePayloads = flags['include-payloads'];
    const includeHeaders = flags['include-headers'];
    const includeClient = flags['include-client'];
    const includeParameters = flags['include-parameters'];
    const includeChannels = flags['include-channels'];
    const includeTypes = flags['include-types'];
    const includeModels = flags['include-models'];
    const channelsProtocols = flags['channels-protocols'];
    const languages = flags['languages'];
    const noOutput = flags['no-output'];
    const gitignoreGenerated = flags['gitignore-generated'];
    return {
      includeChannels,
      includeParameters,
      includePayloads,
      includeHeaders,
      includeClient,
      includeTypes,
      includeModels,
      channelsProtocols,
      outputDirectory,
      configName,
      inputFile,
      inputType,
      configType,
      languages,
      noOutput,
      gitignoreGenerated
    };
  }

  /**
   * Interactively ask the user for which configuration to create
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async runInteractive(
    flags: FlagTypes,
    {configTypeIsDefault}: {configTypeIsDefault: boolean}
  ) {
    let {
      includeChannels,
      includeParameters,
      includePayloads,
      includeHeaders,
      includeClient,
      includeTypes,
      includeModels,
      channelsProtocols,
      configName,
      outputDirectory,
      inputFile,
      inputType,
      configType,
      languages,
      noOutput,
      gitignoreGenerated
    } = flags;

    const questions: any[] = [];

    questions.push({
      name: 'configName',
      message: map.configName.description,
      default: map.configName.default,
      type: 'input'
    });
    if (!inputFile) {
      questions.push({
        name: 'inputFile',
        message: map.inputFile.description,
        type: 'input'
      });
    }
    if (!inputType) {
      questions.push({
        name: 'inputType',
        message: 'Type of the input file to generate code from',
        type: 'list',
        choices: [
          {
            name: 'asyncapi',
            checked: true,
            value: 'asyncapi',
            line: 'AsyncAPI document'
          },
          {
            name: 'openapi',
            checked: false,
            value: 'openapi',
            line: 'OpenAPI document'
          },
          {
            name: 'jsonschema',
            checked: false,
            value: 'jsonschema',
            line: 'JSON Schema document'
          }
        ]
      });
    }
    // Only ask when the user did not pass an explicit `--config-type`; an
    // explicit flag must win over the (always-present) default.
    if (configTypeIsDefault) {
      questions.push({
        name: 'configType',
        message: 'Type of configuration?',
        type: 'list',
        choices: [
          {
            name: 'esm',
            checked: true,
            value: 'esm',
            line: 'ESM JavaScript style configuration, enables all features'
          },
          {
            name: 'json',
            value: 'json',
            line: 'JSON style configuration, enables most features'
          },
          {
            name: 'yaml',
            value: 'yaml',
            line: 'YAML style configuration, enables most features'
          },
          {
            name: 'ts',
            value: 'ts',
            line: 'TS style configuration, enables all features'
          }
        ]
      });
    }

    if (!languages) {
      questions.push({
        name: 'languages',
        message: 'Which language do you wish generate for?',
        type: 'list',
        choices: [
          {
            name: 'typescript',
            checked: true,
            value: 'typescript',
            line: 'Generate TypeScript'
          }
        ]
      });
    }

    if (!includeClient) {
      questions.push({
        name: 'includeClient',
        message: 'Do you want to include client wrapper?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'client', flags: {languages, inputType}, answers})
      });
    }
    if (!includePayloads) {
      questions.push({
        name: 'includePayloads',
        message: 'Do you want to include payload structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'payloads', flags: {languages, inputType}, answers})
      });
    }
    if (!includeHeaders) {
      questions.push({
        name: 'includeHeaders',
        message: 'Do you want to include headers structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'headers', flags: {languages, inputType}, answers})
      });
    }
    if (!includeParameters) {
      questions.push({
        name: 'includeParameters',
        message: 'Do you want to include parameters structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'parameters', flags: {languages, inputType}, answers})
      });
    }
    if (!includeChannels) {
      questions.push({
        name: 'includeChannels',
        message:
          'Do you want to include helper functions for interacting with channels?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'channels', flags: {languages, inputType}, answers})
      });
    }
    if (!includeTypes) {
      questions.push({
        name: 'includeTypes',
        message: 'Do you want to include general type definitions?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'types', flags: {languages, inputType}, answers})
      });
    }
    if (!includeModels) {
      questions.push({
        name: 'includeModels',
        message: 'Do you want to include data models?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          shouldAskInclude({preset: 'models', flags: {languages, inputType}, answers})
      });
    }

    // Ask which protocols to generate channel/client functions for, but only
    // for AsyncAPI inputs where channels or the client wrapper are included.
    // OpenAPI seeds `http_client` automatically, so it is not asked here.
    if (!channelsProtocols) {
      questions.push({
        name: 'channelsProtocols',
        message:
          'Which protocols should channel functions be generated for?',
        type: 'checkbox',
        choices: ChannelProtocolOptions.map((protocol) => ({
          name: protocol,
          value: protocol
        })),
        when: (answers: InquirerAnswers) => {
          const effectiveInputType = inputType ?? answers.inputType;
          const wantsChannels =
            (includeChannels ?? answers.includeChannels) === true;
          const wantsClient =
            (includeClient ?? answers.includeClient) === true;
          return (
            effectiveInputType === 'asyncapi' && (wantsChannels || wantsClient)
          );
        }
      });
    }

    questions.push({
      name: 'gitignoreGenerated',
      message: 'GitIgnore generated files?',
      type: 'confirm',
      default: true
    });

    if (questions.length) {
      const answers: any = await inquirer.prompt(questions);

      // An explicit `--config-type` flag skips its question, so only take the
      // answer when one was collected.
      configType = answers.configType ?? configType;
      includeChannels ??= answers.includeChannels;
      includeParameters ??= answers.includeParameters;
      includePayloads ??= answers.includePayloads;
      includeHeaders ??= answers.includeHeaders;
      includeClient ??= answers.includeClient;
      includeTypes ??= answers.includeTypes;
      includeModels ??= answers.includeModels;
      channelsProtocols ??= answers.channelsProtocols;
      inputFile ??= answers.inputFile;
      inputType ??= answers.inputType;
      configName ??= answers.configName;
      languages ??= answers.languages;
      gitignoreGenerated ??= answers.gitignoreGenerated;
    }

    await this.createConfiguration({
      configType,
      includeChannels,
      includeParameters,
      includePayloads,
      includeHeaders,
      includeClient,
      includeTypes,
      includeModels,
      channelsProtocols,
      inputFile,
      inputType,
      languages,
      noOutput,
      configName,
      outputDirectory,
      gitignoreGenerated
    });
  }

  /**
   * Based on the flags, create the appropriate configuration file
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async createConfiguration(flags: FlagTypes) {
    const configuration: any = {
      inputType: flags.inputType,
      inputPath: flags.inputFile,
      language: flags.languages,
      generators: []
    };
    const isTypescript = flags.languages === 'typescript';
    if (flags.includeChannels) {
      if (isTypescript && supportsGenerator('channels', flags.inputType)) {
        const generator: any = {...defaultTypeScriptChannelsGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        delete generator.parameterGeneratorId;
        delete generator.payloadGeneratorId;
        // OpenAPI only produces HTTP channel functions; seed the protocol so
        // the generator emits something instead of an empty channels config.
        if (flags.inputType === 'openapi') {
          generator.protocols = ['http_client'];
        } else if (flags.channelsProtocols && flags.channelsProtocols.length > 0) {
          generator.protocols = [...flags.channelsProtocols];
        }
        configuration.generators.push(generator);
      }
    }
    if (flags.includePayloads) {
      if (isTypescript && supportsGenerator('payloads', flags.inputType)) {
        const generator: any = {...defaultTypeScriptPayloadGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeHeaders) {
      if (isTypescript && supportsGenerator('headers', flags.inputType)) {
        const generator: any = {...defaultTypeScriptHeadersOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeClient) {
      if (isTypescript && supportsGenerator('client', flags.inputType)) {
        const generator: any = {...defaultTypeScriptClientGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        delete generator.channelsGeneratorId;
        // The client generator defaults to NATS; OpenAPI inputs use the HTTP
        // client protocol instead.
        if (flags.inputType === 'openapi') {
          generator.protocols = ['http'];
        }
        configuration.generators.push(generator);
      }
    }
    // eslint-disable-next-line sonarjs/no-collapsible-if
    if (flags.includeParameters) {
      if (isTypescript && supportsGenerator('parameters', flags.inputType)) {
        const generator: any = {...defaultTypeScriptParametersOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeTypes) {
      if (isTypescript && supportsGenerator('types', flags.inputType)) {
        const generator: any = {...defaultTypeScriptTypesOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeModels) {
      if (isTypescript && supportsGenerator('models', flags.inputType)) {
        const generator: any = {...defaultTypeScriptModelsOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    // A configuration with no generators would generate nothing. Fail loudly
    // instead of silently writing an empty, useless config and printing success.
    if (configuration.generators.length === 0) {
      this.error(
        `No generators were configured for '${flags.inputType ?? 'the selected input'}', so the configuration would generate nothing.\n` +
          'Re-run `codegen init` interactively and choose at least one generator, or pass one or more include flags: ' +
          '--include-payloads, --include-parameters, --include-headers, --include-channels, --include-client, --include-types, --include-models ' +
          '(availability depends on --input-type).',
        {exit: 1}
      );
    }

    // A channels generator on AsyncAPI with no protocols produces only an empty
    // barrel. The config is still valid, so warn rather than error.
    const channelsGenerator = configuration.generators.find(
      (generator: any) => generator.preset === 'channels'
    );
    if (
      flags.inputType === 'asyncapi' &&
      channelsGenerator &&
      (!channelsGenerator.protocols || channelsGenerator.protocols.length === 0)
    ) {
      Logger.warn(
        "The channels generator has no protocols set, so no channel functions will be generated. Set 'protocols' in the generated configuration (or pass --channels-protocols) to choose protocols such as nats, kafka, mqtt, amqp."
      );
    }

    let fileOutput: string = '';
    let fileExtension: string = 'mjs';
    if (flags.configType === 'json') {
      fileExtension = 'json';
      fileOutput = JSON.stringify(
        {
          $schema:
            'https://raw.githubusercontent.com/the-codegen-project/cli/main/schemas/configuration-schema-0.json',
          ...configuration
        },
        null,
        2
      );
    } else if (flags.configType === 'yaml') {
      fileExtension = 'yaml';
      fileOutput = `# yaml-language-server: $schema=https://raw.githubusercontent.com/the-codegen-project/cli/main/schemas/configuration-schema-0.json
${YAML.stringify(configuration)}`;
    } else if (flags.configType === 'esm') {
      const stringifiedConfiguration = JSON.stringify(configuration, null, 2);
      const unquotedConfiguration = stringifiedConfiguration.replace(
        /"([^"]+)":/g,
        '$1:'
      );
      fileOutput = `/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default ${unquotedConfiguration};`;
    } else if (flags.configType === 'ts') {
      fileExtension = 'ts';
      const stringifiedConfiguration = JSON.stringify(configuration, null, 2);
      const unquotedConfiguration = stringifiedConfiguration.replace(
        /"([^"]+)":/g,
        '$1:'
      );
      fileOutput = `import { TheCodegenConfiguration } from '@the-codegen-project/cli';
const config: TheCodegenConfiguration = ${unquotedConfiguration};
export default config;`;
    }
    const outputPath = this.realizeConfigFile(flags);
    let outputFilePath: any = path.parse(outputPath);
    outputFilePath = path.resolve(
      outputFilePath.dir,
      `${outputFilePath.name}.${fileExtension}`
    );
    if (flags.noOutput) {
      this.log(`${outputFilePath}: ${fileOutput}`);
    } else {
      await writeFile(outputFilePath, fileOutput);
    }
    this.log(
      `Successfully created your sparkling new generation file at ${outputFilePath}`
    );

    // Handle .gitignore updates
    if (flags.gitignoreGenerated && !flags.noOutput) {
      // Derive ignore entries from the generators actually built, so an include
      // flag that was dropped (unsupported for the input type) adds no entry.
      const outputPaths = deriveGitignoreOutputPaths(configuration.generators);

      if (outputPaths.length > 0) {
        const result = await updateGitignore(outputPaths);
        if (result.success) {
          this.log(result.message);
        } else {
          this.log(`Warning: ${result.message}`);
        }
      }
    }
    await this.handleSuccessfulInitTelemetry(flags);
  }
  async handleSuccessfulInitTelemetry(flags: FlagTypes) {
    // Track init completion (non-blocking, never throws)
    const enabledGenerators: string[] = [];
    if (flags.includePayloads) {
      enabledGenerators.push('payloads');
    }
    if (flags.includeParameters) {
      enabledGenerators.push('parameters');
    }
    if (flags.includeHeaders) {
      enabledGenerators.push('headers');
    }
    if (flags.includeChannels) {
      enabledGenerators.push('channels');
    }
    if (flags.includeClient) {
      enabledGenerators.push('client');
    }
    if (flags.includeTypes) {
      enabledGenerators.push('types');
    }
    if (flags.includeModels) {
      enabledGenerators.push('models');
    }

    // Track init completion (fire and forget, never throws)
    trackEvent({
      event: 'init_executed',
      config_type: flags.configType,
      input_type: flags.inputType,
      generators:
        enabledGenerators.length > 0 ? enabledGenerators.join(',') : 'none',
      language: flags.languages,
      completed: true
    });
  }
}
