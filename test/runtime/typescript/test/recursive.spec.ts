import {NodeMessage} from '../src/recursive/payloads/NodeMessage';
import {GraphNodeMessage} from '../src/recursive/payloads/GraphNodeMessage';
import {GraphEdge} from '../src/recursive/payloads/GraphEdge';

describe('recursive payloads', () => {
  describe('self-recursive schema', () => {
    const tree = new NodeMessage({
      label: 'root',
      children: [
        new NodeMessage({
          label: 'branch',
          children: [new NodeMessage({label: 'leaf'})]
        }),
        new NodeMessage({label: 'sibling'})
      ]
    });

    test('a self-recursive schema produces a single self-referencing model', () => {
      expect(tree.children?.[0]).toBeInstanceOf(NodeMessage);
      expect(tree.children?.[0].children?.[0].label).toEqual('leaf');
    });

    test('a multi-level tree survives marshal and unmarshal with its structure intact', () => {
      const roundTripped = NodeMessage.unmarshal(tree.marshal());

      expect(roundTripped.label).toEqual('root');
      expect(roundTripped.children).toHaveLength(2);
      expect(roundTripped.children?.[0]).toBeInstanceOf(NodeMessage);
      expect(roundTripped.children?.[0].label).toEqual('branch');
      expect(roundTripped.children?.[0].children?.[0]).toBeInstanceOf(
        NodeMessage
      );
      expect(roundTripped.children?.[0].children?.[0].label).toEqual('leaf');
      expect(roundTripped.children?.[1].label).toEqual('sibling');
      expect(roundTripped.marshal()).toEqual(tree.marshal());
    });

    test('a leaf node marshals without an empty children key', () => {
      expect(new NodeMessage({label: 'only'}).marshal()).toEqual(
        '{"label":"only"}'
      );
    });
  });

  describe('mutually recursive schemas', () => {
    const graph = new GraphNodeMessage({
      name: 'start',
      edge: new GraphEdge({
        weight: 1.5,
        target: new GraphNodeMessage({
          name: 'end',
          edge: new GraphEdge({weight: 2.5})
        })
      })
    });

    test('each side of the cycle is its own model, cross-referencing the other', () => {
      expect(graph.edge).toBeInstanceOf(GraphEdge);
      expect(graph.edge?.target).toBeInstanceOf(GraphNodeMessage);
      expect(graph.edge?.target?.edge).toBeInstanceOf(GraphEdge);
    });

    test('an alternating cycle survives marshal and unmarshal with its structure intact', () => {
      const roundTripped = GraphNodeMessage.unmarshal(graph.marshal());

      expect(roundTripped.name).toEqual('start');
      expect(roundTripped.edge).toBeInstanceOf(GraphEdge);
      expect(roundTripped.edge?.weight).toEqual(1.5);
      expect(roundTripped.edge?.target).toBeInstanceOf(GraphNodeMessage);
      expect(roundTripped.edge?.target?.name).toEqual('end');
      expect(roundTripped.edge?.target?.edge?.weight).toEqual(2.5);
      expect(roundTripped.marshal()).toEqual(graph.marshal());
    });
  });
});
