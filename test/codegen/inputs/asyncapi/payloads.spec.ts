import {processAsyncAPIPayloads} from '../../../../src/codegen/inputs/asyncapi/generators/payloads';
import {loadAsyncapiFromMemory} from '../../../../src/codegen/inputs/asyncapi';
import {Logger} from '../../../../src/LoggingInterface';

const docWith = (messagesYaml: string): string => `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  test:
    address: test
    messages:
${messagesYaml}
`;

const msgA = `      MsgA:
        payload:
          type: object
          properties:
            a:
              type: string`;
const msgBNoPayload = `      MsgB: {}`;
const msgC = `      MsgC:
        payload:
          type: object
          properties:
            c:
              type: number`;

describe('processAsyncAPIPayloads multi-message handling', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('keeps every payload-bearing message when a payload-less message sits in the middle', async () => {
    const document = await loadAsyncapiFromMemory(
      docWith([msgA, msgBNoPayload, msgC].join('\n'))
    );
    const processed = await processAsyncAPIPayloads(document as any);

    const channel = processed.channelPayloads['test'];
    expect(channel).toBeDefined();
    expect(Array.isArray(channel.schema.oneOf)).toBe(true);
    // Today the loop `break`s on MsgB, dropping MsgC — the union should hold both.
    expect(channel.schema.oneOf).toHaveLength(2);
    const ids = channel.schema.oneOf.map((entry: any) => entry.$id);
    expect(ids).toContain('MsgA');
    expect(ids).toContain('MsgC');

    // The skipped payload-less message must be reported, not silently dropped.
    expect(warnSpy).toHaveBeenCalled();
    const warned = warnSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(warned).toContain('MsgB');

    expect(channel.schema).toMatchSnapshot();
  });

  it('yields no channel payload when every message is payload-less', async () => {
    const document = await loadAsyncapiFromMemory(
      docWith([msgBNoPayload, `      MsgD: {}`].join('\n'))
    );
    const processed = await processAsyncAPIPayloads(document as any);
    expect(processed.channelPayloads['test']).toBeUndefined();
  });

  it('yields a plain schema (not a union) when exactly one message carries a payload', async () => {
    const document = await loadAsyncapiFromMemory(
      docWith([msgA, msgBNoPayload].join('\n'))
    );
    const processed = await processAsyncAPIPayloads(document as any);
    const channel = processed.channelPayloads['test'];
    expect(channel).toBeDefined();
    expect(channel.schema.oneOf).toBeUndefined();
    expect(channel.schema.properties?.a).toBeDefined();
  });
});
