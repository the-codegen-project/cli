import path from 'path';
import { runCommand } from '@oclif/test';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');

describe('generate', () => {
  it('shows user email when logged in', async () => {
    const root = path.resolve(__dirname, '../../')
    const {stdout, stderr, error, result} = await runCommand<{name: string}>(['generate', CONFIG_MJS]);
    expect(stdout).toEqual('');
  });
});
