import path from 'path';
import { runCommand } from '@oclif/test';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');

describe('generate', () => {
  it('should be able generate simple configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`generate ${CONFIG_MJS}`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
});
