import * as path from 'path';
import * as fs from 'fs';
import {filesToTest, typescriptConfig } from './test_files';
import {loadAsyncapi, loadConfigFile, RunGeneratorContext, runGenerators } from '../../src';
import { execCommand } from './utils';

jest.setTimeout(100000);
describe.each(typescriptConfig)(
  'Should be able to handle configuration %s', 
  (configFile) => {
    let config, filePath;
    beforeAll(async () => {
      const loadedConfig = await loadConfigFile(path.resolve('./test/blackbox/', configFile.file));
      config = loadedConfig.config;
      filePath = loadedConfig.filePath;
    })
    describe.each(filesToTest)(
      'with schema %s',
      (schemaFile) => {
        const outputDirectoryPath = path.basename(configFile.file).split('.')[0];
        const outputPath = path.resolve('./test/blackbox/output', path.parse(schemaFile.file).name, outputDirectoryPath);
        beforeAll(async () => {
          if (fs.existsSync(outputPath)) {
            fs.rmSync(outputPath, { recursive: true });
          }
        });
        afterAll(async () => {
          if (fs.existsSync(outputPath)) {
            //fs.rmSync(outputPath, { recursive: true });
          }
        });
        test('and be syntactically correct', async () => {
          const newConfig = {...config}
          const newGens = [...newConfig.generators]
          newConfig.generators = []
          newConfig.inputPath = path.resolve('./', schemaFile.file);

          const outputDirectoryPath = outputPath;
          for (let [index, generator] of Object.entries(newGens)) {
            newConfig.generators[index] = {...generator}
            newConfig.generators[index].outputPath = path.resolve(outputDirectoryPath, './src', generator.outputPath);
          }

          const context: RunGeneratorContext = {
            configuration: newConfig,
            documentPath: path.resolve('./test/blackbox/', schemaFile.file),
            configFilePath: filePath
          };
          if (newConfig.inputType === 'asyncapi') {
            const document = await loadAsyncapi(context);
            context.asyncapiDocument = document;
          }
          await runGenerators(context);
          fs.cpSync(path.resolve(__dirname, './projects/typescript'), path.resolve(outputDirectoryPath), {recursive: true});
          const srcDirectory = path.resolve(outputDirectoryPath, './src');
          if(!fs.existsSync(srcDirectory)) {
            fs.mkdirSync(srcDirectory)
            fs.writeFileSync(path.resolve(srcDirectory, './index.ts'), '')
          }
          const transpileCommand = `cd ${outputDirectoryPath} && npm i && npm run build`;
          await execCommand(transpileCommand, true);

          // All good, could compile.
          expect(true).toEqual(true);
        });
      }
    );
  }
);
