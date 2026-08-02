import {processAsyncAPIPayloads} from '../../../../src/codegen/inputs/asyncapi/generators/payloads';
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
    const document = await loadAsyncapiFromMemory({
      input: docWith([msgA, msgBNoPayload, msgC].join('\n'))
    });
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
    const document = await loadAsyncapiFromMemory({
      input: docWith([msgBNoPayload, `      MsgD: {}`].join('\n'))
    });
    const processed = await processAsyncAPIPayloads(document as any);
    expect(processed.channelPayloads['test']).toBeUndefined();
  });

  it('yields a plain schema (not a union) when exactly one message carries a payload', async () => {
    const document = await loadAsyncapiFromMemory({
      input: docWith([msgA, msgBNoPayload].join('\n'))
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const channel = processed.channelPayloads['test'];
    expect(channel).toBeDefined();
    expect(channel.schema.oneOf).toBeUndefined();
    expect(channel.schema.properties?.a).toBeDefined();
  });
});

const recursiveDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  tree:
    address: tree
    messages:
      NodeMessage:
        payload:
          $ref: '#/components/schemas/Node'
components:
  schemas:
    Node:
      type: object
      required: [label]
      properties:
        label:
          type: string
        children:
          type: array
          items:
            $ref: '#/components/schemas/Node'
`;

const mutuallyRecursiveDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  mutual:
    address: mutual
    messages:
      AMessage:
        payload:
          $ref: '#/components/schemas/A'
components:
  schemas:
    A:
      type: object
      properties:
        name:
          type: string
        b:
          $ref: '#/components/schemas/B'
    B:
      type: object
      properties:
        size:
          type: number
        a:
          $ref: '#/components/schemas/A'
`;

const recursiveUnionDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  tree:
    address: tree
    messages:
      NodeMessage:
        payload:
          $ref: '#/components/schemas/Node'
      LeafMessage:
        payload:
          $ref: '#/components/schemas/Leaf'
components:
  schemas:
    Node:
      type: object
      properties:
        label:
          type: string
        children:
          type: array
          items:
            $ref: '#/components/schemas/Node'
    Leaf:
      type: object
      properties:
        value:
          type: string
`;

const nonRecursiveDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  flat:
    address: flat
    messages:
      FlatMessage:
        payload:
          $ref: '#/components/schemas/Flat'
components:
  schemas:
    Flat:
      type: object
      properties:
        label:
          type: string
`;

/** Every `$ref` string anywhere in a fragment. */
const collectRefs = (node: any): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((entry) => collectRefs(entry));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    key === '$ref' && typeof value === 'string' ? [value] : collectRefs(value)
  );
};

/** Model names Modelina emits for a fragment, derived from the file names. */
const generateModelNames = async (schema: any): Promise<string[]> => {
  const result = await generateModels({
    generator: new TypeScriptFileGenerator(),
    input: schema,
    outputPath: 'src/models'
  });
  return result.files.map((file) =>
    file.path.replace('src/models/', '').replace(/\.ts$/, '')
  );
};

describe('processAsyncAPIPayloads recursive schemas', () => {
  it('rewrites a self-recursive pointer to the fragment root', async () => {
    const document = await loadAsyncapiFromMemory({input: recursiveDocument});
    const processed = await processAsyncAPIPayloads(document as any);
    const {schema} = processed.channelPayloads['tree'];

    expect(collectRefs(schema)).toEqual(['#']);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema).toMatchSnapshot();
  });

  it('generates a single self-referencing model for a self-recursive payload', async () => {
    const document = await loadAsyncapiFromMemory({input: recursiveDocument});
    const processed = await processAsyncAPIPayloads(document as any);
    const {schema} = processed.channelPayloads['tree'];

    const result = await generateModels({
      generator: new TypeScriptFileGenerator(),
      input: schema,
      outputPath: 'src/models'
    });
    const modelNames = result.files.map((file) =>
      file.path.replace('src/models/', '').replace(/\.ts$/, '')
    );

    expect(modelNames).toEqual(['NodeMessage']);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
    expect(result.files[0].content).toContain('NodeMessage[]');
  });

  it('hoists the non-inlined half of a mutually recursive pair into `definitions`', async () => {
    const document = await loadAsyncapiFromMemory({
      input: mutuallyRecursiveDocument
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const {schema} = processed.channelPayloads['mutual'];

    expect(collectRefs(schema).sort()).toEqual(['#', '#/definitions/B']);
    expect(schema.definitions.B.$id).toEqual('B');
    expect(schema).toMatchSnapshot();
  });

  it('generates two cross-referencing models for mutual recursion', async () => {
    const document = await loadAsyncapiFromMemory({
      input: mutuallyRecursiveDocument
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const modelNames = await generateModelNames(
      processed.channelPayloads['mutual'].schema
    );

    expect(modelNames.sort()).toEqual(['AMessage', 'B']);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
  });

  it('rewrites a recursive union member to its `oneOf` pointer', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveUnionDocument
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const {schema} = processed.channelPayloads['tree'];

    const nodeIndex = schema.oneOf.findIndex(
      (member: any) => member['x-parser-schema-id'] === 'Node'
    );
    expect(collectRefs(schema)).toEqual([`#/oneOf/${nodeIndex}`]);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema).toMatchSnapshot();
  });

  it('generates one model per union member with no duplicates', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveUnionDocument
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const modelNames = await generateModelNames(
      processed.channelPayloads['tree'].schema
    );

    // A duplicate-class regression shows up only as an extra model carrying a
    // name already in the set, so both the count and the uniqueness matter.
    expect(modelNames).toHaveLength(3);
    expect(modelNames.sort()).toEqual([
      'LeafMessage',
      'NodeMessage',
      'TreePayload'
    ]);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
  });

  it('leaves a non-recursive payload fragment untouched', async () => {
    const document = await loadAsyncapiFromMemory({
      input: nonRecursiveDocument
    });
    const processed = await processAsyncAPIPayloads(document as any);
    const {schema} = processed.channelPayloads['flat'];

    expect(collectRefs(schema)).toEqual([]);
    expect(schema).not.toHaveProperty('definitions');
  });
});
