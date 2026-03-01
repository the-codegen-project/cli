/**
 * Runtime tests for object payload types.
 * Tests simple objects, required/optional properties, nested objects,
 * additional properties, and defaults.
 *
 * NOTE: Some issues discovered:
 * - NestedObject/DeeplyNestedObject marshal expects nested .marshal() method
 */
import { SimpleObject } from '../../src/payload-types/payloads/SimpleObject';
import { ObjectWithRequired } from '../../src/payload-types/payloads/ObjectWithRequired';
import { ObjectWithOptional } from '../../src/payload-types/payloads/ObjectWithOptional';
import { NestedObject } from '../../src/payload-types/payloads/NestedObject';
import { DeeplyNestedObject } from '../../src/payload-types/payloads/DeeplyNestedObject';
import { ObjectAdditionalPropsTrue } from '../../src/payload-types/payloads/ObjectAdditionalPropsTrue';
import { ObjectAdditionalPropsFalse } from '../../src/payload-types/payloads/ObjectAdditionalPropsFalse';
import { ObjectAdditionalPropsSchema } from '../../src/payload-types/payloads/ObjectAdditionalPropsSchema';
import { ObjectWithDefaults } from '../../src/payload-types/payloads/ObjectWithDefaults';

describe('Object Types', () => {
  describe('SimpleObject', () => {
    test('should marshal simple object', () => {
      const obj = new SimpleObject({ name: 'John', age: 30 });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe('John');
      expect(parsed.age).toBe(30);
    });

    test('should unmarshal simple object', () => {
      const json = '{"name":"Jane","age":25}';
      const obj = SimpleObject.unmarshal(json);
      expect(obj.name).toBe('Jane');
      expect(obj.age).toBe(25);
    });

    test('should roundtrip correctly', () => {
      const original = new SimpleObject({ name: 'Test', age: 42 });
      const serialized = original.marshal();
      const restored = SimpleObject.unmarshal(serialized);
      expect(restored.name).toBe(original.name);
      expect(restored.age).toBe(original.age);
    });

    test('should validate correct object', () => {
      const result = SimpleObject.validate({
        data: { name: 'Test', age: 30 }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with missing optional properties', () => {
      const result = SimpleObject.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with partial properties', () => {
      const result = SimpleObject.validate({
        data: { name: 'Test' }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ObjectWithRequired', () => {
    test('should marshal object with required fields', () => {
      const obj = new ObjectWithRequired({
        id: 'abc123',
        name: 'Required Test'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe('abc123');
      expect(parsed.name).toBe('Required Test');
    });

    test('should marshal object with optional field', () => {
      const obj = new ObjectWithRequired({
        id: 'abc123',
        name: 'Test',
        optionalField: 'optional value'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.optional_field).toBe('optional value');
    });

    test('should validate object with all required fields', () => {
      const result = ObjectWithRequired.validate({
        data: { id: 'abc', name: 'Test' }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with required and optional fields', () => {
      const result = ObjectWithRequired.validate({
        data: { id: 'abc', name: 'Test', optional_field: 'extra' }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate object missing required id', () => {
      const result = ObjectWithRequired.validate({
        data: { name: 'Test' }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'required' })
        ])
      );
    });

    test('should invalidate object missing required name', () => {
      const result = ObjectWithRequired.validate({
        data: { id: 'abc' }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate empty object', () => {
      const result = ObjectWithRequired.validate({
        data: {}
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('ObjectWithOptional', () => {
    test('should marshal object with all fields', () => {
      const obj = new ObjectWithOptional({
        field1: 'a',
        field2: 'b',
        field3: 'c'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.field1).toBe('a');
      expect(parsed.field2).toBe('b');
      expect(parsed.field3).toBe('c');
    });

    test('should validate empty object', () => {
      const result = ObjectWithOptional.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with some fields', () => {
      const result = ObjectWithOptional.validate({
        data: { field1: 'value' }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with all fields', () => {
      const result = ObjectWithOptional.validate({
        data: { field1: 'a', field2: 'b', field3: 'c' }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('NestedObject', () => {
    // Unskipped - fix verifies nested object marshal works
    test('should marshal nested object', () => {
      const obj = new NestedObject({ outer: { inner: 'test' } });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.outer.inner).toBe('test');
    });

    test('should unmarshal nested object', () => {
      const json = '{"outer":{"inner":"test"}}';
      const obj = NestedObject.unmarshal(json);
      expect(obj.outer?.inner).toBe('test');
    });

    // New roundtrip test
    test('should roundtrip nested object', () => {
      const original = new NestedObject({ outer: { inner: 'roundtrip' } });
      const serialized = original.marshal();
      const restored = NestedObject.unmarshal(serialized);
      expect(restored.outer?.inner).toBe('roundtrip');
    });

    test('should validate nested object', () => {
      const result = NestedObject.validate({
        data: { outer: { inner: 'value' } }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with empty outer', () => {
      const result = NestedObject.validate({
        data: { outer: {} }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('DeeplyNestedObject', () => {
    // Unskipped - fix verifies deeply nested object marshal works
    test('should marshal deeply nested object', () => {
      const obj = new DeeplyNestedObject({
        level1: { level2: { level3: { value: 'deep' } } }
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.level1.level2.level3.value).toBe('deep');
    });

    test('should unmarshal deeply nested object', () => {
      const json = '{"level1":{"level2":{"level3":{"value":"test"}}}}';
      const obj = DeeplyNestedObject.unmarshal(json);
      expect(obj.level1?.level2?.level3?.value).toBe('test');
    });

    // Unskipped roundtrip test
    test('should roundtrip deeply nested object', () => {
      const original = new DeeplyNestedObject({
        level1: { level2: { level3: { value: 'roundtrip' } } }
      });
      const serialized = original.marshal();
      const restored = DeeplyNestedObject.unmarshal(serialized);
      expect(restored.level1?.level2?.level3?.value).toBe('roundtrip');
    });

    test('should validate deeply nested structure', () => {
      const result = DeeplyNestedObject.validate({
        data: {
          level1: {
            level2: {
              level3: {
                value: 'test'
              }
            }
          }
        }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ObjectAdditionalPropsTrue', () => {
    test('should marshal object with extra properties', () => {
      const obj = new ObjectAdditionalPropsTrue({
        known: 'value'
      });
      // Additional properties may be accessible via additionalProperties map
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.known).toBe('value');
    });

    test('should validate object with known property only', () => {
      const result = ObjectAdditionalPropsTrue.validate({
        data: { known: 'value' }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with extra properties', () => {
      const result = ObjectAdditionalPropsTrue.validate({
        data: { known: 'value', extra: 'allowed', another: 123 }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object', () => {
      const result = ObjectAdditionalPropsTrue.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ObjectAdditionalPropsFalse', () => {
    test('should validate object with only known property', () => {
      const result = ObjectAdditionalPropsFalse.validate({
        data: { known: 'value' }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate object with extra properties', () => {
      const result = ObjectAdditionalPropsFalse.validate({
        data: { known: 'value', extra: 'not allowed' }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'additionalProperties' })
        ])
      );
    });

    test('should validate empty object', () => {
      const result = ObjectAdditionalPropsFalse.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ObjectAdditionalPropsSchema', () => {
    test('should validate object with integer additional properties', () => {
      const result = ObjectAdditionalPropsSchema.validate({
        data: { known: 'value', count: 42, total: 100 }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate object with non-integer additional properties', () => {
      const result = ObjectAdditionalPropsSchema.validate({
        data: { known: 'value', extra: 'string not allowed' }
      });
      expect(result.valid).toBe(false);
    });

    test('should validate object with only known property', () => {
      const result = ObjectAdditionalPropsSchema.validate({
        data: { known: 'value' }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('ObjectWithDefaults', () => {
    test('should marshal object with explicit values', () => {
      const obj = new ObjectWithDefaults({
        status: 'active',
        count: 10,
        enabled: false
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.status).toBe('active');
      expect(parsed.count).toBe(10);
      expect(parsed.enabled).toBe(false);
    });

    test('should unmarshal object with explicit values', () => {
      const json = '{"status":"complete","count":5,"enabled":true}';
      const obj = ObjectWithDefaults.unmarshal(json);
      expect(obj.status).toBe('complete');
      expect(obj.count).toBe(5);
      expect(obj.enabled).toBe(true);
    });

    test('should validate object with values', () => {
      const result = ObjectWithDefaults.validate({
        data: { status: 'test', count: 1, enabled: true }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object (defaults apply)', () => {
      const result = ObjectWithDefaults.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    test('should validate partial object', () => {
      const result = ObjectWithDefaults.validate({
        data: { status: 'partial' }
      });
      expect(result.valid).toBe(true);
    });
  });
});
