import { runCommand } from '@oclif/test';

describe('init', () => {
  it('should generate configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-file='output' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
});
