/* eslint-disable prefer-const */
import {Command, Flags} from '@oclif/core';
import {writeFile} from 'node:fs/promises';
import path from 'path';
import YAML from 'yaml';
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const inquirer = require('inquirer');
import {
  defaultJavaPayloadGenerator,
  defaultTypeScriptChannelsGenerator,
  defaultTypeScriptParametersOptions,
  defaultTypeScriptPayloadGenerator
} from '../codegen/generators';
interface FlagTypes {
  inputFile: string;
  inputType: string;
  configType: 'esm' | 'json' | 'yaml';
  outputFile: string;
  includePayloads: boolean;
  includeParameters: boolean;
  includeChannels: boolean;
  languages: 'typescript' | 'java';
  noOutput: boolean;
}
export default class Init extends Command {
  static description = 'Initialize The Codegen Project in your project';
  static args = {};

  static flags = {
    help: Flags.help(),
    'input-file': Flags.file({
      description: 'Input file for the code generation'
    }),
    'input-type': Flags.string({
      description: 'Input file type',
      options: ['asyncapi']
    }),
    'output-directory': Flags.string({
      description:
        'Output configuration location, path to where the configuration file should be located. If relative path, the current working directory of the terminal will be used.',
      default: './'
    }),
    'config-type': Flags.string({
      description:
        "The type of configuration file. 'esm' can do everything, 'json' and 'yaml' is more restrictive. Read more here: https://github.com/the-codegen-project/cli/blob/main/docs/configurations.md",
      options: ['esm', 'json', 'yaml'],
      default: 'esm'
    }),
    languages: Flags.string({
      description: 'Which languages do you wish to generate code for?',
      options: ['typescript', 'java']
    }),
    'no-tty': Flags.boolean({
      description: 'Do not use an interactive terminal'
    }),
    'include-payloads': Flags.boolean({
      description:
        'Include payloads generation, available for typescript and java.',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) =>
                flags['languages'] === 'java' ||
                flags['languages'] === 'typescript'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-parameters': Flags.boolean({
      description: 'Include parameters generation, available for typescript.',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'include-channels': Flags.boolean({
      description: 'Include channels generation, available for typescript.',
      relationships: [
        {
          flags: [
            {
              name: 'languages',
              when: async (flags: any) => flags['languages'] === 'typescript'
            }
          ],
          type: 'all'
        }
      ]
    }),
    'no-output': Flags.boolean({
      description: 'For testing only, ignore',
      hidden: true
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

  realizeFlags(flags: any): FlagTypes {
    const inputFile = flags['input-file'];
    const inputType = flags['input-type'];
    const configType = flags['config-type'];
    let outputFile = flags['output-directory'];
    // eslint-disable-next-line no-undef
    const processCurrentDir = process.cwd();
    if (configType === 'esm') {
      outputFile = path.resolve(processCurrentDir, outputFile, 'codegen.mjs');
    } else if (configType === 'json') {
      outputFile = path.resolve(processCurrentDir, outputFile, 'codegen.json');
    } else if (configType === 'yaml') {
      outputFile = path.resolve(processCurrentDir, outputFile, 'codegen.yaml');
    }
    const includePayloads = flags['include-payloads'];
    const includeParameters = flags['include-parameters'];
    const includeChannels = flags['include-channels'];
    const languages = flags['languages'];
    const noOutput = flags['no-output'];
    return {
      includeChannels,
      includeParameters,
      includePayloads,
      outputFile,
      inputFile,
      inputType,
      configType,
      languages,
      noOutput
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async runInteractive(flags: FlagTypes) {
    let {
      includeChannels,
      includeParameters,
      includePayloads,
      outputFile,
      inputFile,
      inputType,
      configType,
      languages,
      noOutput
    } = flags;

    const questions: any[] = [];

    if (!outputFile) {
      questions.push({
        name: 'outputFile',
        message: 'name of the file?',
        type: 'input'
      });
    }
    if (!inputFile) {
      questions.push({
        name: 'inputFile',
        message: 'Name of the input file to generate code from?',
        type: 'input'
      });
    }
    if (!inputType) {
      questions.push({
        name: 'inputType',
        message: 'Type of the input file to generate code from?',
        type: 'list',
        choices: [
          {
            name: 'asyncapi',
            checked: true,
            value: 'asyncapi',
            line: 'AsyncAPI document'
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
          },
          {
            name: 'java',
            value: 'java',
            line: 'Generate Java'
          }
        ]
      });
    }

    if (!includePayloads) {
      questions.push({
        name: 'includePayloads',
        message: 'Do you want to include payload structures?',
        type: 'confirm',
        when: (flags: any) =>
          flags['languages'] === 'typescript' || flags['languages'] === 'java'
      });
    }
    if (!includeParameters) {
      questions.push({
        name: 'includeParameters',
        message: 'Do you want to include parameters structures?',
        type: 'confirm',
        when: (flags: any) => flags['languages'] === 'typescript'
      });
    }
    if (!includeChannels) {
      questions.push({
        name: 'includeChannels',
        message:
          'Do you want to include helper functions for interacting with channels?',
        type: 'confirm',
        when: (flags: any) => flags['languages'] === 'typescript'
      });
    }

    if (questions.length) {
      const answers: any = await inquirer.prompt(questions);

      configType = answers.configType;
      if (includeChannels === undefined) {
        includeChannels = answers.includeChannels;
      }
      if (includeParameters === undefined) {
        includeParameters = answers.includeParameters;
      }
      if (includePayloads === undefined) {
        includePayloads = answers.includePayloads;
      }
      if (!inputFile) {
        inputFile = answers.inputFile;
      }
      if (!inputType) {
        inputType = answers.inputType;
      }
      if (!languages) {
        languages = answers.languages;
      }
      if (!outputFile) {
        outputFile = answers.outputFile;
      }
    }

    await this.createConfiguration({
      configType,
      includeChannels,
      includeParameters,
      includePayloads,
      inputFile,
      inputType,
      languages,
      outputFile,
      noOutput
    });
  }

  async createConfiguration(flags: FlagTypes) {
    const configuration: any = {
      inputType: flags.inputType,
      inputPath: flags.inputFile,
      language: flags.languages,
      generators: []
    };
    // eslint-disable-next-line sonarjs/no-collapsible-if
    if (flags.includeChannels) {
      if (flags.languages === 'typescript') {
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
      if (flags.languages === 'typescript') {
        const generator: any = {...defaultTypeScriptPayloadGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      } else if (flags.languages === 'java') {
        const generator: any = {...defaultJavaPayloadGenerator};
        delete generator.dependencies;
        delete generator.id;
        delete generator.language;
        configuration.generators.push(generator);
      }
    }
    // eslint-disable-next-line sonarjs/no-collapsible-if
    if (flags.includeParameters) {
      if (flags.languages === 'typescript') {
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
${YAML.stringify(configuration)}
`;
    } else if (flags.configType === 'esm') {
      const stringifiedConfiguration = JSON.stringify(configuration, null, 2);
      const unquotedConfiguration = stringifiedConfiguration.replace(
        /"([^"]+)":/g,
        '$1:'
      );
      fileOutput = `/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default ${unquotedConfiguration};
`;
    }
    let outputFilePath: any = path.parse(flags.outputFile);
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
  }
}
