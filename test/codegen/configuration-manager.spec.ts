import path from 'path';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');
const CONFIG_JSON = path.resolve(__dirname, '../configs/config.json');
const CONFIG_YAML = path.resolve(__dirname, '../configs/config.yaml');
import {loadConfigFile} from '../../src/codegen/configuration-manager.ts';

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
});
