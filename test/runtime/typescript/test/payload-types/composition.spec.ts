/**
 * Runtime tests for composition payload types.
 * Tests oneOf, anyOf, allOf, and discriminated unions.
 *
 * NOTE: Some issues discovered:
 * - oneOf schemas have conflicting "type":"object" with nested primitive types
 */
import * as OneOfTwoTypes from '../../src/payload-types/payloads/OneOfTwoTypes';
import * as OneOfThreeTypes from '../../src/payload-types/payloads/OneOfThreeTypes';
import * as OneOfWithDiscriminator from '../../src/payload-types/payloads/OneOfWithDiscriminator';
import * as AnyOfTwoTypes from '../../src/payload-types/payloads/AnyOfTwoTypes';
import { AllOfTwoTypes } from '../../src/payload-types/payloads/AllOfTwoTypes';
import { AllOfThreeTypes } from '../../src/payload-types/payloads/AllOfThreeTypes';

describe('Composition Types', () => {
  // oneOf schemas have conflicting "type":"object" at root with primitive types in oneOf
  // The AJV strict mode warns about this, but validation still works
  // We disable strict mode for these tests by passing { strict: false } to AJV
  describe('OneOfTwoTypes (string | integer)', () => {
    test('should marshal string value', () => {
      const value: OneOfTwoTypes.OneOfTwoTypes = 'hello';
      const serialized = OneOfTwoTypes.marshal(value);
      expect(serialized).toBe('"hello"');
    });

    test('should marshal integer value', () => {
      const value: OneOfTwoTypes.OneOfTwoTypes = 42;
      const serialized = OneOfTwoTypes.marshal(value);
      expect(serialized).toBe('42');
    });

    test('should unmarshal string value', () => {
      const result = OneOfTwoTypes.unmarshal('"test"');
      expect(result).toBe('test');
    });

    test('should unmarshal integer value', () => {
      const result = OneOfTwoTypes.unmarshal('123');
      expect(result).toBe(123);
    });

    test('should validate string', () => {
      // Pass as JSON string since validate parses strings
      const result = OneOfTwoTypes.validate({
        data: '"hello"',
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate integer', () => {
      const result = OneOfTwoTypes.validate({
        data: 123,
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate boolean (not in oneOf)', () => {
      const result = OneOfTwoTypes.validate({
        data: true,
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate array (not in oneOf)', () => {
      const result = OneOfTwoTypes.validate({
        data: [1, 2, 3],
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate object (not in oneOf)', () => {
      const result = OneOfTwoTypes.validate({
        data: { key: 'value' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('OneOfThreeTypes (string | integer | object)', () => {
    test('should marshal string value', () => {
      const value: OneOfThreeTypes.OneOfThreeTypes = 'text';
      const serialized = OneOfThreeTypes.marshal(value);
      expect(serialized).toBe('"text"');
    });

    test('should marshal integer value', () => {
      const value: OneOfThreeTypes.OneOfThreeTypes = 100;
      const serialized = OneOfThreeTypes.marshal(value);
      expect(serialized).toBe('100');
    });

    test('should marshal object value', () => {
      const value = { value: 'test' } as OneOfThreeTypes.OneOfThreeTypes;
      const serialized = OneOfThreeTypes.marshal(value);
      const parsed = JSON.parse(serialized);
      expect(parsed.value).toBe('test');
    });

    test('should validate string', () => {
      // Pass as JSON string since validate parses strings
      const result = OneOfThreeTypes.validate({
        data: '"hello"',
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate integer', () => {
      const result = OneOfThreeTypes.validate({
        data: 100,
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object', () => {
      const result = OneOfThreeTypes.validate({
        data: { value: 'test' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object', () => {
      const result = OneOfThreeTypes.validate({
        data: {},
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate boolean', () => {
      const result = OneOfThreeTypes.validate({
        data: true,
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate array', () => {
      const result = OneOfThreeTypes.validate({
        data: [1, 2],
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('OneOfWithDiscriminator (Dog | Cat)', () => {
    test('should marshal dog payload', () => {
      const value = { petType: 'dog', breed: 'Labrador', barkVolume: 8 } as OneOfWithDiscriminator.OneOfWithDiscriminator;
      const serialized = OneOfWithDiscriminator.marshal(value);
      const parsed = JSON.parse(serialized);
      expect(parsed.petType).toBe('dog');
      expect(parsed.breed).toBe('Labrador');
      expect(parsed.barkVolume).toBe(8);
    });

    test('should marshal cat payload', () => {
      const value = { petType: 'cat', breed: 'Persian', meowPitch: 'high' } as OneOfWithDiscriminator.OneOfWithDiscriminator;
      const serialized = OneOfWithDiscriminator.marshal(value);
      const parsed = JSON.parse(serialized);
      expect(parsed.petType).toBe('cat');
      expect(parsed.breed).toBe('Persian');
      expect(parsed.meowPitch).toBe('high');
    });

    test('should unmarshal dog payload', () => {
      const json = '{"petType":"dog","breed":"Beagle","barkVolume":5}';
      const result = OneOfWithDiscriminator.unmarshal(json);
      expect(result.petType).toBe('dog');
    });

    test('should unmarshal cat payload', () => {
      const json = '{"petType":"cat","breed":"Siamese","meowPitch":"low"}';
      const result = OneOfWithDiscriminator.unmarshal(json);
      expect(result.petType).toBe('cat');
    });

    test('should validate dog with discriminator', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { petType: 'dog', breed: 'Golden Retriever', barkVolume: 7 },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate cat with discriminator', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { petType: 'cat', breed: 'Maine Coon', meowPitch: 'medium' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate minimal dog', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { petType: 'dog' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate minimal cat', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { petType: 'cat' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate unknown pet type', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { petType: 'bird' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate missing discriminator', () => {
      const result = OneOfWithDiscriminator.validate({
        data: { breed: 'Unknown' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('AnyOfTwoTypes (object with name | object with id)', () => {
    test('should validate object with name', () => {
      const result = AnyOfTwoTypes.validate({
        data: { name: 'Test' },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with id', () => {
      const result = AnyOfTwoTypes.validate({
        data: { id: 123 },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with both name and id', () => {
      const result = AnyOfTwoTypes.validate({
        data: { name: 'Test', id: 123 },
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object', () => {
      // anyOf with optional properties - empty object should match
      const result = AnyOfTwoTypes.validate({
        data: {},
        ajvOptions: { strict: false }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('AllOfTwoTypes (BaseEntity + TimestampMixin)', () => {
    test('should marshal combined object', () => {
      const obj = new AllOfTwoTypes({
        id: 'entity-1',
        name: 'Test Entity',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T15:45:00Z'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe('entity-1');
      expect(parsed.name).toBe('Test Entity');
    });

    test('should unmarshal combined object', () => {
      const json = '{"id":"test-id","name":"Test","createdAt":"2024-01-01T00:00:00Z","updatedAt":"2024-01-02T00:00:00Z"}';
      const obj = AllOfTwoTypes.unmarshal(json);
      expect(obj.id).toBe('test-id');
      expect(obj.name).toBe('Test');
    });

    test('should validate object with all properties', () => {
      const result = AllOfTwoTypes.validate({
        data: {
          id: 'abc',
          name: 'Test',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-16T15:45:00Z'
        }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with required properties only', () => {
      const result = AllOfTwoTypes.validate({
        data: { id: 'abc' }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate object missing required id', () => {
      const result = AllOfTwoTypes.validate({
        data: { name: 'Test' }
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('AllOfThreeTypes (BaseEntity + TimestampMixin + AuditMixin)', () => {
    test('should marshal fully combined object', () => {
      const obj = new AllOfThreeTypes({
        id: 'entity-2',
        name: 'Full Entity',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T15:45:00Z',
        createdBy: 'user-1',
        updatedBy: 'user-2'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe('entity-2');
      expect(parsed.name).toBe('Full Entity');
    });

    test('should validate object with all properties from all schemas', () => {
      const result = AllOfThreeTypes.validate({
        data: {
          id: 'abc',
          name: 'Test',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-16T15:45:00Z',
          createdBy: 'admin',
          updatedBy: 'user'
        }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with required only', () => {
      const result = AllOfThreeTypes.validate({
        data: { id: 'abc' }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with partial properties', () => {
      const result = AllOfThreeTypes.validate({
        data: {
          id: 'abc',
          createdBy: 'system'
        }
      });
      expect(result.valid).toBe(true);
    });
  });
});
