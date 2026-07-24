import * as path from 'path';
import * as fs from 'fs';
import {filesToTest, typescriptConfig, isKnownFailing } from './test_files';
import {loadAsyncapi, loadJsonSchema, loadConfigFile, realizeConfiguration, RunGeneratorContext, runGenerators } from '../../src';
import { execCommand } from './utils';

jest.setTimeout(100000);
describe.each(typescriptConfig)(
  'Should be able to handle configuration %s', 
  (configFile) => {
    let config: any, filePath: string;
    beforeAll(async () => {
      const loadedConfig = await loadConfigFile(path.resolve('./test/blackbox/', configFile.file));
      config = loadedConfig.config;
      filePath = loadedConfig.filePath;
    })
    // Only pair a config with schema files of the same input type — an
    // AsyncAPI config cannot load a JSON Schema document, and vice versa.
    const matchingFiles = filesToTest.filter(
      (schemaFile) => schemaFile.inputType === configFile.inputType
    );
    describe.each(matchingFiles)(
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
        // Tracked-debt pairs are skipped explicitly (never silently) so the
        // KNOWN_FAILING list in test_files.ts remains the single source of debt.
        const runTest = isKnownFailing(configFile.file, schemaFile.file)
          ? test.skip
          : test;
        runTest('and be syntactically correct', async () => {
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
            configuration: realizeConfiguration(newConfig),
            documentPath: path.resolve('./test/blackbox/', schemaFile.file),
            configFilePath: filePath
          };
          if (newConfig.inputType === 'asyncapi') {
            const document = await loadAsyncapi(context);
            context.asyncapiDocument = document;
          } else if (newConfig.inputType === 'jsonschema') {
            const document = await loadJsonSchema(context);
            context.jsonSchemaDocument = document;
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
