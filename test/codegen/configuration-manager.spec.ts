/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-jasmine-globals */
import path from 'path';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');
const CONFIG_JSON = path.resolve(__dirname, '../configs/config.json');
const CONFIG_YAML = path.resolve(__dirname, '../configs/config.yaml');
const FULL_CONFIG = path.resolve(__dirname, '../configs/config-all.js');
import {discoverConfiguration, loadConfigFile, realizeConfiguration} from '../../src/codegen/configuration-manager.ts';
import { TheCodegenConfiguration } from '../../src/codegen/types.ts';
import { Logger } from '../../src/LoggingInterface.ts';

describe('configuration manager', () => {
  it('should work with correct ESM config', async () => {
    const config = await loadConfigFile({
      configPath: CONFIG_MJS,
      configType: 'esm'
    });
    expect(config.inputType).toEqual('asyncapi');
  });
  it('should work with correct JSON config', async () => {
    const config = await loadConfigFile({
      configPath: CONFIG_JSON,
      configType: 'json'
    });
    expect(config.inputType).toEqual('asyncapi');
  });
  it('should work with correct YAML config', async () => {
    const config = await loadConfigFile({
      configPath: CONFIG_YAML,
      configType: 'yaml'
    });
    expect(config.inputType).toEqual('asyncapi');
  });
  it('should work with full configuration', async () => {
    const config = await loadConfigFile({
      configPath: FULL_CONFIG,
      configType: 'esm'
    });
    expect(config.inputType).toEqual('asyncapi');
  });
  it('should work with discover configuration', async () => {
    const config = await discoverConfiguration(CONFIG_JSON);
    const loadedConfig = await loadConfigFile(config);
    expect(loadedConfig.inputType).toEqual('asyncapi');
  });
  
  describe('realizeConfiguration', () => {
    it('should be able to validate correct configuration', async () => {
      const configuration: TheCodegenConfiguration = {
        inputType: "asyncapi",
        inputPath: "asyncapi.json",
        language: "typescript",
        generators: [
          {
            preset: "channels",
            outputPath: "./src/__gen__/",
            protocols: ['nats']
          }
        ]
      };    
      const realizedConfiguration = realizeConfiguration(configuration);
      expect(realizedConfiguration.generators.length).toEqual(3);
    });

    it('should give errors on incorrect data', async () => {
      const configuration: any = {
        inputType: 123,
        inputPath: 123,
        generators: []
      };
      const logger = {error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn()};
      Logger.setLogger(logger);
      try {
        realizeConfiguration(configuration);
        fail('Should have failed realizing wrong configuration');
      } catch (e) {
        expect(logger.error).toHaveBeenNthCalledWith(1, "\n Invalid discriminator value. Expected 'asyncapi' at \"inputType\"");
      }
    });
  });
});
