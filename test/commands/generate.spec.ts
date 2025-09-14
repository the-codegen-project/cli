import path from 'path';
import { runCommand } from '@oclif/test';
import Generate from '../../src/commands/generate';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');

describe('generate', () => {
  it('should be able generate simple configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should be able to generate hello world with custom presets', async () => {
    const {stdout, stderr, error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('Hello World!');
  });

  describe('watch functionality', () => {
    it('should show watch flag in help output', async () => {
      const {stdout} = await runCommand('generate --help');
      expect(stdout).toContain('--watch');
      expect(stdout).toContain('-w');
      expect(stdout).toContain('--watchPath');
      expect(stdout).toContain('-p');
      expect(stdout).toContain('Watch for file changes');
    });
  });
});
