import * as fs from 'fs';
import * as path from 'path';
import {nats} from '../../../src/asyncapi-tag-organization/channels';
import * as rawNats from '../../../src/asyncapi-tag-organization/channels/nats';

const normalize = (source: string): string => source.replace(/\s+/g, '');

describe('channels organization: asyncapi tag', () => {
  it('groups operations under their operation tag with verbatim leaf names', () => {
    expect(typeof nats.user).toBe('object');
    expect(typeof nats.user.publishToSendUserSignedup).toBe('function');
    expect(typeof nats.user.subscribeToReceiveUserSignedup).toBe('function');
    expect(typeof nats.admin).toBe('object');
    expect(typeof nats.admin.publishToSendAdminAlert).toBe('function');
  });

  it('places operations without a tag under the untagged bucket', () => {
    expect(typeof nats.untagged).toBe('object');
    expect(typeof nats.untagged.publishToSendSystemPing).toBe('function');
  });

  it('leaves reference the same underlying flat functions', () => {
    expect(nats.user.publishToSendUserSignedup).toBe(
      rawNats.publishToSendUserSignedup
    );
    expect(nats.admin.publishToSendAdminAlert).toBe(
      rawNats.publishToSendAdminAlert
    );
    expect(nats.untagged.publishToSendSystemPing).toBe(
      rawNats.publishToSendSystemPing
    );
  });

  it('generated barrel matches the expected reference', () => {
    const generated = fs.readFileSync(
      path.join(__dirname, '../../../src/asyncapi-tag-organization/channels/index.ts'),
      'utf-8'
    );
    const expected = fs.readFileSync(
      path.join(__dirname, 'expected/asyncapi-tag.index.txt'),
      'utf-8'
    );
    expect(normalize(generated)).toBe(normalize(expected));
  });
});
