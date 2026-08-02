import {processAsyncAPIHeaders} from '../../../../src/codegen/inputs/asyncapi/generators/headers';
import {loadAsyncapiFromMemory} from '../../../../src/codegen/inputs/asyncapi';
import {Logger} from '../../../../src/LoggingInterface';
import {generateModels} from '../../../../src/codegen/output';
import {TypeScriptFileGenerator} from '@asyncapi/modelina';

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
    const document = await loadAsyncapiFromMemory({
      input: docWith([msgX, msgY, msgNoHeaders].join('\n'))
    });
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
    const document = await loadAsyncapiFromMemory({
      input: docWith([msgX, msgNoHeaders].join('\n'))
    });
    const processed = processAsyncAPIHeaders(document as any);
    const channel = processed.channelHeaders['test'];
    expect(channel).toBeDefined();
    const schema = channel!.schema as any;
    expect(schema.oneOf).toBeUndefined();
    expect(schema.$id).toEqual('MsgXHeaders');
    expect(channel!.schemaId).toEqual('MsgXHeaders');
  });

  it('yields undefined channel headers when no message has headers', async () => {
    const document = await loadAsyncapiFromMemory({
      input: docWith(msgNoHeaders)
    });
    const processed = processAsyncAPIHeaders(document as any);
    expect(processed.channelHeaders['test']).toBeUndefined();
  });

  it('does not union a reply message into the request channel headers', async () => {
    // A request/reply channel lists both the request and the reply message.
    // The channel headers (consumed as request headers) must not include the
    // reply message's headers.
    const document = await loadAsyncapiFromMemory({
      input: `asyncapi: 3.0.0
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
`
    });
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

const recursiveHeadersDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  tree:
    address: tree
    messages:
      NodeMessage:
        headers:
          $ref: '#/components/schemas/NodeHeaders'
        payload:
          type: object
          properties:
            value:
              type: string
components:
  schemas:
    NodeHeaders:
      type: object
      properties:
        trace:
          type: string
        parent:
          $ref: '#/components/schemas/NodeHeaders'
`;

const recursiveHeaderUnionDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  tree:
    address: tree
    messages:
      NodeMessage:
        headers:
          $ref: '#/components/schemas/NodeHeaders'
        payload:
          type: object
          properties:
            value:
              type: string
      LeafMessage:
        headers:
          $ref: '#/components/schemas/LeafHeaders'
        payload:
          type: object
          properties:
            value:
              type: string
components:
  schemas:
    NodeHeaders:
      type: object
      properties:
        trace:
          type: string
        parent:
          $ref: '#/components/schemas/NodeHeaders'
    LeafHeaders:
      type: object
      properties:
        leaf:
          type: string
`;

const nonRecursiveHeadersDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  flat:
    address: flat
    messages:
      FlatMessage:
        headers:
          $ref: '#/components/schemas/FlatHeaders'
        payload:
          type: object
          properties:
            value:
              type: string
components:
  schemas:
    FlatHeaders:
      type: object
      properties:
        trace:
          type: string
`;

/** Every `$ref` string anywhere in a fragment. */
const collectHeaderRefs = (node: any): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((entry) => collectHeaderRefs(entry));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    key === '$ref' && typeof value === 'string'
      ? [value]
      : collectHeaderRefs(value)
  );
};

/** Model names Modelina emits for a fragment, derived from the file names. */
const generateHeaderModelNames = async (schema: any): Promise<string[]> => {
  const result = await generateModels({
    generator: new TypeScriptFileGenerator(),
    input: schema,
    outputPath: 'src/headers'
  });
  return result.files.map((file) =>
    file.path.replace('src/headers/', '').replace(/\.ts$/, '')
  );
};

describe('processAsyncAPIHeaders recursive schemas', () => {
  it('rewrites a self-recursive pointer to the fragment root', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveHeadersDocument
    });
    const processed = processAsyncAPIHeaders(document as any);
    const schema = processed.channelHeaders['tree']!.schema as any;

    expect(collectHeaderRefs(schema)).toEqual(['#']);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema).toMatchSnapshot();
  });

  it('generates a single self-referencing header model', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveHeadersDocument
    });
    const processed = processAsyncAPIHeaders(document as any);
    const modelNames = await generateHeaderModelNames(
      processed.channelHeaders['tree']!.schema
    );

    expect(modelNames).toEqual(['NodeMessageHeaders']);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
  });

  it('rewrites a recursive union member to its `oneOf` pointer', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveHeaderUnionDocument
    });
    const processed = processAsyncAPIHeaders(document as any);
    const schema = processed.channelHeaders['tree']!.schema as any;

    const nodeIndex = schema.oneOf.findIndex(
      (member: any) => member['x-parser-schema-id'] === 'NodeHeaders'
    );
    expect(collectHeaderRefs(schema)).toEqual([`#/oneOf/${nodeIndex}`]);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema).toMatchSnapshot();
  });

  it('generates one header model per union member with no duplicates', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveHeaderUnionDocument
    });
    const processed = processAsyncAPIHeaders(document as any);
    const modelNames = await generateHeaderModelNames(
      processed.channelHeaders['tree']!.schema
    );

    expect(modelNames).toHaveLength(3);
    expect(modelNames.sort()).toEqual([
      'LeafMessageHeaders',
      'NodeMessageHeaders',
      'TreeHeaders'
    ]);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
  });

  it('leaves a non-recursive header fragment untouched', async () => {
    const document = await loadAsyncapiFromMemory({
      input: nonRecursiveHeadersDocument
    });
    const processed = processAsyncAPIHeaders(document as any);
    const schema = processed.channelHeaders['flat']!.schema as any;

    expect(collectHeaderRefs(schema)).toEqual([]);
    expect(schema).not.toHaveProperty('definitions');
  });
});
