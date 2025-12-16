/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-collapsible-if */
/* eslint-disable prefer-const */
import {Command, Flags} from '@oclif/core';
import {writeFile} from 'node:fs/promises';
import path from 'path';
import YAML from 'yaml';
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const inquirer = require('inquirer');
import {
  defaultTypeScriptChannelsGenerator,
  defaultTypeScriptClientGenerator,
  defaultTypeScriptHeadersOptions,
  defaultTypeScriptParametersOptions,
  defaultTypeScriptPayloadGenerator
} from '../codegen/generators';
import {updateGitignore} from '../utils/gitignore';
import {trackEvent} from '../telemetry';

const ConfigOptions = ['esm', 'json', 'yaml', 'ts'] as const;
const LanguageOptions = ['typescript'] as const;
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
  languages: (typeof LanguageOptions)[number];
  noOutput: boolean;
  gitignoreGenerated: boolean;
}

interface InquirerAnswers {
  configName?: string;
  inputFile?: string;
  inputType?: 'asyncapi' | 'openapi';
  configType?: (typeof ConfigOptions)[number];
  languages?: (typeof LanguageOptions)[number];
  includeClient?: boolean;
  includePayloads?: boolean;
  includeHeaders?: boolean;
  includeParameters?: boolean;
  includeChannels?: boolean;
  gitignoreGenerated?: boolean;
}
export default class Init extends Command {
  static description = 'Initialize The Codegen Project in your project';
  static args = {};

  static flags = {
    help: Flags.help(),
    'input-file': Flags.file({
      description: map.inputFile.description
    }),
    'config-name': Flags.file({
      description: map.configName.description,
      default: map.configName.default
    }),
    'input-type': Flags.string({
      description: 'Input file type',
      options: ['asyncapi', 'openapi']
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
      options: LanguageOptions
    }),
    'no-tty': Flags.boolean({
      description: 'Do not use an interactive terminal'
    }),
    'include-payloads': Flags.boolean({
      description: 'Include payloads generation, available for TypeScript',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            },
            {
              name: 'input-type',
              when: async (flags: any) => flags['input-type'] === 'asyncapi'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-headers': Flags.boolean({
      description: 'Include headers generation, available for TypeScript',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            },
            {
              name: 'input-type',
              when: async (flags: any) => flags['input-type'] === 'asyncapi'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-client': Flags.boolean({
      description: 'Include client generation, available for TypeScript',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            },
            {
              name: 'input-type',
              when: async (flags: any) => flags['input-type'] === 'asyncapi'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-parameters': Flags.boolean({
      description: 'Include parameters generation, available for TypeScript',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            },
            {
              name: 'input-type',
              when: async (flags: any) => flags['input-type'] === 'asyncapi'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-channels': Flags.boolean({
      description: 'Include channels generation, available for TypeScript',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            },
            {
              name: 'input-type',
              when: async (flags: any) => flags['input-type'] === 'asyncapi'
            }
          ],
          type: 'all'
        }
      ]
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
    const {flags} = await this.parse(Init);
    // eslint-disable-next-line no-undef
    const isTTY = process.stdout.isTTY;
    const realizedFlags = this.realizeFlags(flags);

    if (!flags['no-tty'] && isTTY) {
      return this.runInteractive(realizedFlags);
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
    const languages = flags['languages'];
    const noOutput = flags['no-output'];
    const gitignoreGenerated = flags['gitignore-generated'];
    return {
      includeChannels,
      includeParameters,
      includePayloads,
      includeHeaders,
      includeClient,
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
  async runInteractive(flags: FlagTypes) {
    let {
      includeChannels,
      includeParameters,
      includePayloads,
      includeHeaders,
      includeClient,
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
          }
        ]
      });
    }
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
          answers.languages === 'typescript' && answers.inputType === 'asyncapi'
      });
    }
    if (!includePayloads) {
      questions.push({
        name: 'includePayloads',
        message: 'Do you want to include payload structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          answers.languages === 'typescript' && answers.inputType === 'asyncapi'
      });
    }
    if (!includeHeaders) {
      questions.push({
        name: 'includeHeaders',
        message: 'Do you want to include headers structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          answers.languages === 'typescript' && answers.inputType === 'asyncapi'
      });
    }
    if (!includeParameters) {
      questions.push({
        name: 'includeParameters',
        message: 'Do you want to include parameters structures?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          answers.languages === 'typescript' && answers.inputType === 'asyncapi'
      });
    }
    if (!includeChannels) {
      questions.push({
        name: 'includeChannels',
        message:
          'Do you want to include helper functions for interacting with channels?',
        type: 'confirm',
        when: (answers: InquirerAnswers) =>
          answers.languages === 'typescript' && answers.inputType === 'asyncapi'
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

      configType = answers.configType;
      includeChannels ??= answers.includeChannels;
      includeParameters ??= answers.includeParameters;
      includePayloads ??= answers.includePayloads;
      includeHeaders ??= answers.includeHeaders;
      includeClient ??= answers.includeClient;
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
    if (flags.includeChannels) {
      if (flags.languages === 'typescript' && flags.inputType === 'asyncapi') {
        const generator: any = {...defaultTypeScriptChannelsGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        delete generator.parameterGeneratorId;
        delete generator.payloadGeneratorId;
        configuration.generators.push(generator);
      }
    }
    if (flags.includePayloads) {
      if (flags.languages === 'typescript' && flags.inputType === 'asyncapi') {
        const generator: any = {...defaultTypeScriptPayloadGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeHeaders) {
      if (flags.languages === 'typescript' && flags.inputType === 'asyncapi') {
        const generator: any = {...defaultTypeScriptHeadersOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    if (flags.includeClient) {
      if (flags.languages === 'typescript' && flags.inputType === 'asyncapi') {
        const generator: any = {...defaultTypeScriptClientGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        delete generator.channelsGeneratorId;
        configuration.generators.push(generator);
      }
    }
    // eslint-disable-next-line sonarjs/no-collapsible-if
    if (flags.includeParameters) {
      if (flags.languages === 'typescript' && flags.inputType === 'asyncapi') {
        const generator: any = {...defaultTypeScriptParametersOptions};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
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
      const outputPaths: string[] = [];

      // Collect all output paths from enabled generators
      if (flags.includeChannels) {
        outputPaths.push(defaultTypeScriptChannelsGenerator.outputPath);
      }
      if (flags.includePayloads) {
        outputPaths.push(defaultTypeScriptPayloadGenerator.outputPath);
      }
      if (flags.includeHeaders) {
        outputPaths.push(defaultTypeScriptHeadersOptions.outputPath);
      }
      if (flags.includeClient) {
        outputPaths.push(defaultTypeScriptClientGenerator.outputPath);
      }
      if (flags.includeParameters) {
        outputPaths.push(defaultTypeScriptParametersOptions.outputPath);
      }

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
