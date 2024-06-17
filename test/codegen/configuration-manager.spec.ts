import path from 'path';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');
const CONFIG_JSON = path.resolve(__dirname, '../configs/config.json');
const CONFIG_YAML = path.resolve(__dirname, '../configs/config.yaml');
const FULL_CONFIG = path.resolve(__dirname, '../configs/config-all.js');
import {discoverConfiguration, loadConfigFile, realizeConfiguration} from '../../src/codegen/configuration-manager.ts';
import { TheCodegenConfiguration } from '../../src/codegen/types.ts';

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
  it('realizeConfiguration', async () => {
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
});
