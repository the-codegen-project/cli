import * as fs from 'fs';
import * as path from 'path';

const asyncapiPayloads = path.join(
  __dirname,
  '../src/asyncapi-filter/payloads'
);
const openapiPayloads = path.join(__dirname, '../src/openapi-filter/payloads');

const exists = (dir: string, file: string): boolean =>
  fs.existsSync(path.join(dir, file));

describe('filter: AsyncAPI channels/operations', () => {
  it('generates payload models for the kept channels', () => {
    expect(exists(asyncapiPayloads, 'StringMessage.ts')).toBe(true);
    expect(exists(asyncapiPayloads, 'ArrayMessage.ts')).toBe(true);
  });

  it('does not generate the excluded channel (exclude wins over include)', () => {
    // union/payload is included then excluded — exclude must win.
    expect(exists(asyncapiPayloads, 'UnionMessage.ts')).toBe(false);
  });

  it('prunes payload models for channels left out of include (orphans)', () => {
    expect(exists(asyncapiPayloads, 'UserSignedUp.ts')).toBe(false);
    expect(exists(asyncapiPayloads, 'LegacyNotification.ts')).toBe(false);
  });

  it('a kept payload model still serializes correctly', async () => {
    const StringMessage = await import(
      '../src/asyncapi-filter/payloads/StringMessage'
    );
    const serialized = StringMessage.marshal('hello world');
    const roundTripped = StringMessage.unmarshal(serialized);
    expect(StringMessage.marshal(roundTripped)).toEqual(serialized);
  });
});

describe('filter: OpenAPI paths/operations + orphan pruning', () => {
  it('generates models for the kept path', () => {
    expect(exists(openapiPayloads, 'User.ts')).toBe(true);
    expect(exists(openapiPayloads, 'ListUsersResponse_200.ts')).toBe(true);
  });

  it('keeps a component schema referenced by a kept schema (nested)', () => {
    // Address is referenced only via User; keeping /users must keep Address.
    expect(exists(openapiPayloads, 'Address.ts')).toBe(true);
  });

  it('drops the response model of the excluded operation', () => {
    expect(exists(openapiPayloads, 'ListOrdersResponse_200.ts')).toBe(false);
  });

  it('prunes a component schema referenced only by a dropped operation', () => {
    // Order is referenced solely by /orders (dropped) — it must be pruned.
    expect(exists(openapiPayloads, 'Order.ts')).toBe(false);
  });
});
