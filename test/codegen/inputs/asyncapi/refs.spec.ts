import {resolveAsyncapiComponentRefs} from '../../../../src/codegen/inputs/asyncapi/refs';
import {loadAsyncapiFromMemory} from '../../../../src/codegen/inputs/asyncapi';

const selfRecursiveDocument = `asyncapi: 3.0.0
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

// A -> B -> C -> A. Every hop stays a pointer because the whole chain is a
// cycle, which is what makes transitive collection observable.
const chainDocument = `asyncapi: 3.0.0
info:
  title: T
  version: 1.0.0
channels:
  chain:
    address: chain
    messages:
      AMessage:
        payload:
          $ref: '#/components/schemas/A'
components:
  schemas:
    A:
      type: object
      properties:
        b:
          $ref: '#/components/schemas/B'
    B:
      type: object
      properties:
        c:
          $ref: '#/components/schemas/C'
    C:
      type: object
      properties:
        a:
          $ref: '#/components/schemas/A'
`;

const loadDocument = async (input: string): Promise<any> =>
  loadAsyncapiFromMemory({input});

describe('resolveAsyncapiComponentRefs', () => {
  it('returns the fragment untouched when no component pointer survived', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {label: {type: 'string'}},
      $id: 'Plain'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['Node', '#']])
    });

    // Same reference — the gate must not rebuild fragments it has nothing to do
    // to, otherwise every existing snapshot churns.
    expect(resolved).toBe(fragment);
    expect(resolved).not.toHaveProperty('definitions');
  });

  it('rewrites a pointer to the inlined root as `#`', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {
        children: {
          type: 'array',
          items: {$ref: '#/components/schemas/Node'}
        }
      },
      'x-parser-schema-id': 'Node',
      $id: 'NodeMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['Node', '#']])
    });

    expect(resolved.properties.children.items.$ref).toEqual('#');
    expect(resolved).not.toHaveProperty('definitions');
  });

  it('rewrites a pointer to an inlined union member as `#/oneOf/<index>`', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      oneOf: [
        {type: 'object', 'x-parser-schema-id': 'Leaf', $id: 'LeafMessage'},
        {
          type: 'object',
          properties: {
            children: {
              type: 'array',
              items: {$ref: '#/components/schemas/Node'}
            }
          },
          'x-parser-schema-id': 'Node',
          $id: 'NodeMessage'
        }
      ],
      $id: 'TreePayload'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([
        ['Leaf', '#/oneOf/0'],
        ['Node', '#/oneOf/1']
      ])
    });

    expect(resolved.oneOf[1].properties.children.items.$ref).toEqual(
      '#/oneOf/1'
    );
    expect(resolved).not.toHaveProperty('definitions');
  });

  it('hoists a component that is not inlined into `definitions` with `$id` stamped', async () => {
    const document = await loadDocument(chainDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {b: {$ref: '#/components/schemas/B'}},
      'x-parser-schema-id': 'A',
      $id: 'AMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['A', '#']])
    });

    expect(resolved.properties.b.$ref).toEqual('#/definitions/B');
    // Without `$id` Modelina names the hoisted model after the referencing
    // property (`AB`) rather than after the component.
    expect(resolved.definitions.B.$id).toEqual('B');
  });

  it('collects transitively referenced components', async () => {
    const document = await loadDocument(chainDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {b: {$ref: '#/components/schemas/B'}},
      'x-parser-schema-id': 'A',
      $id: 'AMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['A', '#']])
    });

    expect(Object.keys(resolved.definitions).sort()).toEqual(['B', 'C']);
    expect(resolved.definitions.B.properties.c.$ref).toEqual(
      '#/definitions/C'
    );
    // C points back at A, which is inlined as the fragment root.
    expect(resolved.definitions.C.properties.a.$ref).toEqual('#');
  });

  it('terminates on a cycle and never hoists an already-inlined component', async () => {
    const document = await loadDocument(chainDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {b: {$ref: '#/components/schemas/B'}},
      'x-parser-schema-id': 'A',
      $id: 'AMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['A', '#']])
    });

    expect(resolved.definitions).not.toHaveProperty('A');
    expect(resolved).toMatchSnapshot();
  });

  it('leaves a pointer to an unknown component untouched', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {ghost: {$ref: '#/components/schemas/DoesNotExist'}},
      $id: 'Ghost'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['Node', '#']])
    });

    expect(resolved.properties.ghost.$ref).toEqual(
      '#/components/schemas/DoesNotExist'
    );
    expect(resolved).not.toHaveProperty('definitions');
  });

  it('leaves pointers that do not target `components/schemas` untouched', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {
        node: {$ref: '#/components/schemas/Node'},
        other: {$ref: '#/definitions/Existing'}
      },
      definitions: {Existing: {type: 'string'}},
      'x-parser-schema-id': 'Node',
      $id: 'NodeMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['Node', '#']])
    });

    expect(resolved.properties.node.$ref).toEqual('#');
    expect(resolved.properties.other.$ref).toEqual('#/definitions/Existing');
    expect(resolved.definitions.Existing).toEqual({type: 'string'});
  });

  it('copies rather than mutates nodes shared with the parser document tree', async () => {
    const document = await loadDocument(selfRecursiveDocument);
    // `payloads.ts` rebuilds only the top-level object; nested nodes stay shared
    // with the parser's document tree, so an in-place rewrite would corrupt
    // every other extraction site.
    const sharedNode = {$ref: '#/components/schemas/Node'};
    const sharedParent = {items: sharedNode};
    const fragment = {
      type: 'object',
      $schema: 'http://json-schema.org/draft-07/schema',
      properties: {children: sharedParent},
      'x-parser-schema-id': 'Node',
      $id: 'NodeMessage'
    };

    const resolved = resolveAsyncapiComponentRefs({
      fragment,
      asyncapiDocument: document,
      inlinedTargets: new Map([['Node', '#']])
    });

    expect(resolved.properties.children.items.$ref).toEqual('#');
    expect(sharedNode.$ref).toEqual('#/components/schemas/Node');
    expect(sharedParent.items).toBe(sharedNode);
  });
});
