import {processAsyncAPIHeaders} from '../../../../src/codegen/inputs/asyncapi/generators/headers';
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

const msgX = `      MsgX:
        headers:
          type: object
          properties:
            x-foo:
              type: string
        payload:
          type: object`;
const msgY = `      MsgY:
        headers:
          type: object
          properties:
            x-bar:
              type: number
        payload:
          type: object`;
const msgNoHeaders = `      MsgZ:
        payload:
          type: object`;

describe('processAsyncAPIHeaders multi-message handling', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('builds a oneOf union across all header-bearing messages', async () => {
    const document = await loadAsyncapiFromMemory(
      docWith([msgX, msgY, msgNoHeaders].join('\n'))
    );
    const processed = processAsyncAPIHeaders(document as any);

    const channel = processed.channelHeaders['test'];
    expect(channel).toBeDefined();
    const schema = channel!.schema as any;
    // Today only the first header-bearing message wins; the union should hold both.
    expect(Array.isArray(schema.oneOf)).toBe(true);
    expect(schema.oneOf).toHaveLength(2);
    expect(typeof schema.$id).toBe('string');

    const props = schema.oneOf.flatMap((entry: any) =>
      Object.keys(entry.properties ?? {})
    );
    expect(props).toContain('x-foo');
    expect(props).toContain('x-bar');

    // The header-less message must be reported.
    expect(warnSpy).toHaveBeenCalled();
    const warned = warnSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(warned).toContain('MsgZ');

    expect(schema).toMatchSnapshot();
  });

  it('leaves a single header-bearing message unchanged (no union)', async () => {
    const document = await loadAsyncapiFromMemory(
      docWith([msgX, msgNoHeaders].join('\n'))
    );
    const processed = processAsyncAPIHeaders(document as any);
    const channel = processed.channelHeaders['test'];
    expect(channel).toBeDefined();
    const schema = channel!.schema as any;
    expect(schema.oneOf).toBeUndefined();
    expect(schema.$id).toEqual('MsgXHeaders');
    expect(channel!.schemaId).toEqual('MsgXHeaders');
  });

  it('yields undefined channel headers when no message has headers', async () => {
    const document = await loadAsyncapiFromMemory(docWith(msgNoHeaders));
    const processed = processAsyncAPIHeaders(document as any);
    expect(processed.channelHeaders['test']).toBeUndefined();
  });

  it('does not union a reply message into the request channel headers', async () => {
    // A request/reply channel lists both the request and the reply message.
    // The channel headers (consumed as request headers) must not include the
    // reply message's headers.
    const document = await loadAsyncapiFromMemory(`asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  userItems:
    address: user/items
    messages:
      itemRequest:
        headers:
          type: object
          properties:
            x-req:
              type: string
        payload:
          type: object
      itemResponse:
        headers:
          type: object
          properties:
            x-res:
              type: string
        payload:
          type: object
operations:
  getItems:
    action: send
    channel:
      $ref: '#/channels/userItems'
    messages:
      - $ref: '#/channels/userItems/messages/itemRequest'
    reply:
      channel:
        $ref: '#/channels/userItems'
      messages:
        - $ref: '#/channels/userItems/messages/itemResponse'
`);
    const processed = processAsyncAPIHeaders(document as any);
    const channel = processed.channelHeaders['userItems'];
    expect(channel).toBeDefined();
    const schema = channel!.schema as any;
    // Only the request message's headers — not a union with the reply's.
    expect(schema.oneOf).toBeUndefined();
    const keys = Object.keys(schema.properties ?? {});
    expect(keys).toContain('x-req');
    expect(keys).not.toContain('x-res');
  });
});
