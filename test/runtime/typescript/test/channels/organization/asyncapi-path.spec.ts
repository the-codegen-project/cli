import * as fs from 'fs';
import * as path from 'path';
import {nats} from '../../../src/asyncapi-path-organization/channels';
import * as rawNats from '../../../src/asyncapi-path-organization/channels/nats';

const normalize = (source: string): string => source.replace(/\s+/g, '');

describe('channels organization: asyncapi path', () => {
  it('nests operation-sourced functions by channel address segments with the function name as the leaf', () => {
    expect(typeof nats.user).toBe('object');
    expect(typeof nats.user.signedup).toBe('object');
    expect(typeof nats.user.signedup.publishToSendUserSignedup).toBe('function');
    expect(typeof nats.user.signedup.subscribeToReceiveUserSignedup).toBe(
      'function'
    );
  });

  it('collapses single-segment addresses to one level', () => {
    expect(typeof nats.noparameters).toBe('object');
    expect(typeof nats.noparameters.publishToNoParameter).toBe('function');
  });

  it('leaves reference the same underlying flat functions', () => {
    expect(nats.user.signedup.publishToSendUserSignedup).toBe(
      rawNats.publishToSendUserSignedup
    );
    expect(nats.noparameters.publishToNoParameter).toBe(
      rawNats.publishToNoParameter
    );
  });

  it('generated barrel matches the expected reference', () => {
    const generated = fs.readFileSync(
      path.join(__dirname, '../../../src/asyncapi-path-organization/channels/index.ts'),
      'utf-8'
    );
    const expected = fs.readFileSync(
      path.join(__dirname, 'expected/asyncapi-path.index.txt'),
      'utf-8'
    );
    expect(normalize(generated)).toBe(normalize(expected));
  });
});
