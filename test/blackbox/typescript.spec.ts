import * as path from 'path';
import * as fs from 'fs';
import {filesToTest, typescriptConfig } from './test_files';
import {loadAsyncapi, loadConfigFile, RunGeneratorContext, runGenerators } from '../../src';
import { execCommand } from './utils';
function moveProjectFiles(to: string) {
  fs.cpSync(path.resolve(__dirname, './projects/typescript'), path.resolve(to), {recursive: true});
}

describe.each(filesToTest)(
  'Schemas %s',
  (schemaFile) => {
    describe.each(typescriptConfig)(
      'should be able to handle configuration %s', 
      (configFile) => {
        let outputDirectoryPath = path.basename(configFile.file).split('.')[0];
        outputDirectoryPath = path.resolve('./test/blackbox/output', path.parse(schemaFile.file).name, outputDirectoryPath);
        beforeAll(async () => {
          if (fs.existsSync(outputDirectoryPath)) {
            fs.rmSync(outputDirectoryPath, { recursive: true });
          }
        });
        afterAll(async () => {
          if (fs.existsSync(outputDirectoryPath)) {
            //fs.rmSync(outputDirectoryPath, { recursive: true });
          }
        });
        test('and be syntactically correct', async () => {
          const {config, filePath} = await loadConfigFile(path.resolve('./test/blackbox/', configFile.file));
          config.inputPath = path.resolve('./', schemaFile.file);
          for (const generator of config.generators as any[]) {
            if (generator.outputPath) {generator.outputPath = path.resolve(outputDirectoryPath, './src', generator.outputPath);}
          }
          const context: RunGeneratorContext = {
            configuration: config,
            documentPath: path.resolve('./test/blackbox/', schemaFile.file),
            configFilePath: filePath
          };
          if (config.inputType === 'asyncapi') {
            const document = await loadAsyncapi(context);
            context.asyncapiDocument = document;
          }
          await runGenerators(context);
          moveProjectFiles(outputDirectoryPath);
          if(!fs.existsSync(path.resolve(outputDirectoryPath, './src'))) {
            fs.mkdirSync(path.resolve(outputDirectoryPath, './src'))
            fs.writeFileSync(path.resolve(outputDirectoryPath, './src/index.ts'), '')
          }
          const transpileCommand = `cd ${outputDirectoryPath} && npm i && npm run build`;
          await execCommand(transpileCommand, true);

          // All good, could compile.
          expect(true).toEqual(true);
        });
    });
  }
);
