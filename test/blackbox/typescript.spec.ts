import * as path from 'path';
import * as fs from 'fs';
import {filesToTest, typescriptConfig } from './test_files';
import {loadAsyncapi, loadConfigFile, RunGeneratorContext, runGenerators } from '../../src';

describe.each(filesToTest)(
  'Schemas %s',
  (schemaFile) => {
    describe.each(typescriptConfig)('should be able to handle configuration %s', (
      configFile
    ) => {
      let outputDirectoryPath = path.basename(configFile.file).split('.')[0];
      outputDirectoryPath = path.resolve('./output', outputDirectoryPath);
      beforeAll(async () => {
        if (fs.existsSync(outputDirectoryPath)) {
          fs.rmSync(outputDirectoryPath, { recursive: true });
        }
      });
      test('and be syntactically correct', async () => {
        const {config, filePath} = await loadConfigFile(configFile.file);
        config.inputPath = schemaFile.file;
        const context: RunGeneratorContext = {
          configuration: config,
          documentPath: schemaFile.file,
          configFilePath: filePath
        };
        if (config.inputType === 'asyncapi') {
          const document = await loadAsyncapi(context);
          context.asyncapiDocument = document;
        }
        await runGenerators(context);
        context.configuration.generators[0];
        expect(true).toEqual(false);
      });
    });
  }
);
