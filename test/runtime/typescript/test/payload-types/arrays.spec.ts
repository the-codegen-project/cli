/**
 * Runtime tests for array payload types.
 * Tests string arrays, object arrays, nested arrays, and array constraints.
 *
 * NOTE: Some issues discovered:
 * - ISS-002: NestedArray unmarshal has a bug referencing undefined NestedArrayItem
 */
import * as StringArray from '../../src/payload-types/payloads/StringArray';
import * as ObjectArray from '../../src/payload-types/payloads/ObjectArray';
import * as NestedArray from '../../src/payload-types/payloads/NestedArray';
import * as ArrayWithMinItems from '../../src/payload-types/payloads/ArrayWithMinItems';
import * as ArrayWithMaxItems from '../../src/payload-types/payloads/ArrayWithMaxItems';
import * as ArrayWithUniqueItems from '../../src/payload-types/payloads/ArrayWithUniqueItems';
import * as TupleArray from '../../src/payload-types/payloads/TupleArray';

describe('Array Types', () => {
  describe('StringArray', () => {
    test('should marshal string array', () => {
      const value: StringArray.StringArray = ['a', 'b', 'c'];
      const serialized = StringArray.marshal(value);
      expect(serialized).toBe('["a","b","c"]');
    });

    test('should unmarshal string array from string', () => {
      const result = StringArray.unmarshal('["x","y","z"]');
      expect(result).toEqual(['x', 'y', 'z']);
    });

    test('should unmarshal string array from array', () => {
      const result = StringArray.unmarshal(['x', 'y', 'z']);
      expect(result).toEqual(['x', 'y', 'z']);
    });

    test('should handle empty array', () => {
      const value: StringArray.StringArray = [];
      const serialized = StringArray.marshal(value);
      expect(serialized).toBe('[]');
      const deserialized = StringArray.unmarshal(serialized);
      expect(deserialized).toEqual([]);
    });

    test('should handle single item', () => {
      const value: StringArray.StringArray = ['only'];
      const serialized = StringArray.marshal(value);
      expect(serialized).toBe('["only"]');
    });

    test('should validate string array', () => {
      const result = StringArray.validate({ data: ['a', 'b'] });
      expect(result.valid).toBe(true);
    });

    test('should validate empty array', () => {
      const result = StringArray.validate({ data: [] });
      expect(result.valid).toBe(true);
    });

    test('should invalidate array with non-string items', () => {
      const result = StringArray.validate({ data: [1, 2, 3] });
      expect(result.valid).toBe(false);
    });

    test('should invalidate non-array (pass as object)', () => {
      // Pass object directly, not as string to avoid JSON.parse issue
      const result = StringArray.validate({ data: { notAnArray: true } });
      expect(result.valid).toBe(false);
    });
  });

  describe('ObjectArray', () => {
    test('should marshal object array', () => {
      const value: ObjectArray.ObjectArray = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' }
      ];
      const serialized = ObjectArray.marshal(value);
      const parsed = JSON.parse(serialized);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe(1);
      expect(parsed[1].name).toBe('Second');
    });

    test('should unmarshal object array', () => {
      const json = '[{"id":1,"name":"Test"},{"id":2,"name":"Other"}]';
      const result = ObjectArray.unmarshal(json);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].name).toBe('Other');
    });

    test('should handle empty object array', () => {
      const value: ObjectArray.ObjectArray = [];
      const serialized = ObjectArray.marshal(value);
      expect(serialized).toBe('[]');
    });

    test('should validate object array', () => {
      const result = ObjectArray.validate({
        data: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' }
        ]
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object array', () => {
      const result = ObjectArray.validate({ data: [] });
      expect(result.valid).toBe(true);
    });

    test('should validate object with partial properties', () => {
      const result = ObjectArray.validate({
        data: [{ id: 1 }, { name: 'B' }]
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('NestedArray', () => {
    test('should marshal nested array', () => {
      const value: NestedArray.NestedArray = [
        ['a', 'b'],
        ['c', 'd', 'e']
      ];
      const serialized = NestedArray.marshal(value);
      expect(serialized).toBe('[["a","b"],["c","d","e"]]');
    });

    // ISS-002: Unskipped - fix verifies nested array unmarshal works
    test('should unmarshal nested array', () => {
      const json = '[["x","y"],["z"]]';
      const result = NestedArray.unmarshal(json);
      expect(result).toEqual([['x', 'y'], ['z']]);
    });

    test('should handle empty nested array', () => {
      const value: NestedArray.NestedArray = [];
      const serialized = NestedArray.marshal(value);
      expect(serialized).toBe('[]');
    });

    test('should handle nested empty arrays', () => {
      const value: NestedArray.NestedArray = [[], []];
      const serialized = NestedArray.marshal(value);
      expect(serialized).toBe('[[],[]]');
    });

    test('should validate nested array', () => {
      const result = NestedArray.validate({
        data: [['a', 'b'], ['c']]
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate non-nested array', () => {
      const result = NestedArray.validate({
        data: ['a', 'b', 'c'] // should be array of arrays
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('ArrayWithMinItems', () => {
    test('should validate array meeting minItems', () => {
      const result = ArrayWithMinItems.validate({
        data: ['item']
      });
      expect(result.valid).toBe(true);
    });

    test('should validate array exceeding minItems', () => {
      const result = ArrayWithMinItems.validate({
        data: ['a', 'b', 'c']
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate empty array', () => {
      const result = ArrayWithMinItems.validate({
        data: []
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'minItems' })
        ])
      );
    });
  });

  describe('ArrayWithMaxItems', () => {
    test('should validate array within maxItems', () => {
      const result = ArrayWithMaxItems.validate({
        data: ['a', 'b']
      });
      expect(result.valid).toBe(true);
    });

    test('should validate array at exact maxItems', () => {
      const result = ArrayWithMaxItems.validate({
        data: ['1', '2', '3', '4', '5']
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate array exceeding maxItems', () => {
      const result = ArrayWithMaxItems.validate({
        data: ['1', '2', '3', '4', '5', '6']
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'maxItems' })
        ])
      );
    });

    test('should validate empty array', () => {
      const result = ArrayWithMaxItems.validate({
        data: []
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ArrayWithUniqueItems', () => {
    test('should validate array with unique items', () => {
      const result = ArrayWithUniqueItems.validate({
        data: ['a', 'b', 'c']
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate array with duplicate items', () => {
      const result = ArrayWithUniqueItems.validate({
        data: ['a', 'b', 'a']
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'uniqueItems' })
        ])
      );
    });

    test('should validate empty array', () => {
      const result = ArrayWithUniqueItems.validate({
        data: []
      });
      expect(result.valid).toBe(true);
    });

    test('should validate single item array', () => {
      const result = ArrayWithUniqueItems.validate({
        data: ['only']
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('TupleArray', () => {
    test('should marshal tuple', () => {
      const value: TupleArray.TupleArray = ['hello', 42, true];
      const serialized = TupleArray.marshal(value);
      expect(serialized).toBe('["hello",42,true]');
    });

    test('should unmarshal tuple', () => {
      const json = '["test",123,false]';
      const result = TupleArray.unmarshal(json);
      expect(result[0]).toBe('test');
      expect(result[1]).toBe(123);
      expect(result[2]).toBe(false);
    });

    test('should validate correct tuple', () => {
      const result = TupleArray.validate({
        data: ['string', 1, true]
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate tuple with wrong type order', () => {
      const result = TupleArray.validate({
        data: [42, 'string', true] // number first instead of string
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate tuple with wrong types', () => {
      const result = TupleArray.validate({
        data: ['string', 'string', 'string'] // all strings
      });
      expect(result.valid).toBe(false);
    });
  });
});
