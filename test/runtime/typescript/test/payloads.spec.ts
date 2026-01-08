import { UserSignedUp } from '../src/payloads/UserSignedUp';
import * as StringMessage from '../src/payloads/StringMessage';
import * as ArrayMessage from '../src/payloads/ArrayMessage';
import * as UnionMessage from '../src/payloads/UnionMessage';
import { APet } from '../src/openapi/payloads/APet';
import * as FindPetsByStatusAndCategoryResponse_200 from '../src/openapi/payloads/FindPetsByStatusAndCategoryResponse_200';

describe('payloads', () => {
  describe('should be able to serialize and deserialize the model', () => {
    const testObject = new UserSignedUp({
      email: 'emailTest',
      displayName: 'displayNameTest'
    });
    test('be able to serialize model', () => {
      const serialized = testObject.marshal();
      expect(serialized).toEqual("{\"display_name\": \"displayNameTest\",\"email\": \"emailTest\"}");
    });
    test('be able to serialize model and turning it back to a model with the same values', () => {
      const serialized = testObject.marshal();
      const newAddress = UserSignedUp.unmarshal(serialized);
      expect(serialized).toEqual(newAddress.marshal());
    });
  });

  describe('validate function', () => {
    const testObject = new UserSignedUp({
      email: 'test@example.com',
      displayName: 'Test User'
    });

    test('should validate correct payload', () => {
      const result = UserSignedUp.validate({
        data: {
          display_name: 'Test User',
          email: 'test@example.com'
        }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate incorrect email format', () => {
      const result = UserSignedUp.validate({
        data: {
          display_name: 'Test User',
          email: 'invalid-email'
        }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([{
        instancePath: "/email",
        schemaPath: "#/properties/email/format",
        keyword: "format",
        params: {
          format: "email",
        },
        message: "must match format \"email\"",
      }]);
    });

    test('should provide validation function', () => {
      const validate = UserSignedUp.createValidator();
      expect(typeof validate).toBe('function');
    });

    test('should be able to validate multiple times', () => {
      const validate = UserSignedUp.createValidator();
      const result = UserSignedUp.validate({
        data: {
          display_name: 'Test User',
          email: 'test@example.com'
        },
        ajvValidatorFunction: validate
      });
      expect(result.valid).toBe(true);
      expect(UserSignedUp.validate({
        data: {
          display_name: 'Test User',
          email: 'test@example.com'
        },
        ajvValidatorFunction: validate
      }).valid).toBe(true);
    });
  });

  describe('StringMessage (primitive type)', () => {
    test('should marshal a string payload', () => {
      const testString: StringMessage.StringMessage = 'Hello World';
      const serialized = StringMessage.marshal(testString);
      expect(serialized).toEqual('"Hello World"');
    });

    test('should unmarshal a string payload', () => {
      const serialized = '"Hello World"';
      const result = StringMessage.unmarshal(serialized);
      expect(result).toEqual('Hello World');
    });

    test('should marshal and unmarshal roundtrip correctly', () => {
      const original: StringMessage.StringMessage = 'Test roundtrip';
      const serialized = StringMessage.marshal(original);
      const deserialized = StringMessage.unmarshal(serialized);
      expect(deserialized).toEqual(original);
    });

    test('should handle empty string', () => {
      const emptyString: StringMessage.StringMessage = '';
      const serialized = StringMessage.marshal(emptyString);
      expect(serialized).toEqual('""');
      const deserialized = StringMessage.unmarshal(serialized);
      expect(deserialized).toEqual('');
    });

    test('should handle special characters', () => {
      const specialChars: StringMessage.StringMessage = 'Hello\nWorld\t"Quoted"';
      const serialized = StringMessage.marshal(specialChars);
      const deserialized = StringMessage.unmarshal(serialized);
      expect(deserialized).toEqual(specialChars);
    });

    test('should handle unicode characters', () => {
      const unicode: StringMessage.StringMessage = '你好世界 🌍 émojis';
      const serialized = StringMessage.marshal(unicode);
      const deserialized = StringMessage.unmarshal(serialized);
      expect(deserialized).toEqual(unicode);
    });

    test('should validate correct string payload (as JSON string)', () => {
      // When passing data as a string, it must be valid JSON (i.e., the marshalled form)
      const result = StringMessage.validate({
        data: '"Hello World"'
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty string', () => {
      const result = StringMessage.validate({
        data: '""'
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate non-string payload', () => {
      // Passing the raw value (not as a JSON string) - validator expects JSON when string
      const result = StringMessage.validate({
        data: 123  // This is not a string, so will fail validation
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate object payload', () => {
      const result = StringMessage.validate({
        data: { message: 'not a string' }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate array payload', () => {
      const result = StringMessage.validate({
        data: ['not', 'a', 'string']
      });
      expect(result.valid).toBe(false);
    });

    test('should provide validation function', () => {
      const validate = StringMessage.createValidator();
      expect(typeof validate).toBe('function');
    });

    test('should validate multiple times with reusable validator', () => {
      const validate = StringMessage.createValidator();
      const result1 = StringMessage.validate({
        data: '"First string"',
        ajvValidatorFunction: validate
      });
      expect(result1.valid).toBe(true);
      
      const result2 = StringMessage.validate({
        data: '"Second string"',
        ajvValidatorFunction: validate
      });
      expect(result2.valid).toBe(true);
    });
  });

  describe('ArrayMessage (array type)', () => {
    test('should marshal an array payload', () => {
      const testArray: ArrayMessage.ArrayMessage = ['item1', 'item2', 'item3'];
      const serialized = ArrayMessage.marshal(testArray);
      expect(serialized).toEqual('["item1","item2","item3"]');
    });

    test('should unmarshal an array payload from string', () => {
      const serialized = '["item1","item2","item3"]';
      const result = ArrayMessage.unmarshal(serialized);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    test('should unmarshal an array payload from array', () => {
      const array = ['item1', 'item2', 'item3'];
      const result = ArrayMessage.unmarshal(array);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    test('should marshal and unmarshal roundtrip correctly', () => {
      const original: ArrayMessage.ArrayMessage = ['a', 'b', 'c'];
      const serialized = ArrayMessage.marshal(original);
      const deserialized = ArrayMessage.unmarshal(serialized);
      expect(deserialized).toEqual(original);
    });

    test('should handle empty array', () => {
      const emptyArray: ArrayMessage.ArrayMessage = [];
      const serialized = ArrayMessage.marshal(emptyArray);
      expect(serialized).toEqual('[]');
      const deserialized = ArrayMessage.unmarshal(serialized);
      expect(deserialized).toEqual([]);
    });

    test('should handle single item array', () => {
      const singleItem: ArrayMessage.ArrayMessage = ['only'];
      const serialized = ArrayMessage.marshal(singleItem);
      expect(serialized).toEqual('["only"]');
      const deserialized = ArrayMessage.unmarshal(serialized);
      expect(deserialized).toEqual(['only']);
    });

    test('should handle array with special characters', () => {
      const specialChars: ArrayMessage.ArrayMessage = ['hello\nworld', 'tab\there', '"quoted"'];
      const serialized = ArrayMessage.marshal(specialChars);
      const deserialized = ArrayMessage.unmarshal(serialized);
      expect(deserialized).toEqual(specialChars);
    });

    test('should validate correct array payload', () => {
      const result = ArrayMessage.validate({
        data: ['item1', 'item2']
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty array', () => {
      const result = ArrayMessage.validate({
        data: []
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate array with wrong item types', () => {
      const result = ArrayMessage.validate({
        data: [1, 2, 3]  // Numbers instead of strings
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate non-array payload (object)', () => {
      const result = ArrayMessage.validate({
        data: { items: ['a', 'b'] }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate non-array payload (string)', () => {
      // The validate function tries to JSON.parse string inputs, so we pass a valid JSON string
      const result = ArrayMessage.validate({
        data: '"not an array"'  // This is valid JSON for a string, but not an array
      });
      expect(result.valid).toBe(false);
    });

    test('should provide validation function', () => {
      const validate = ArrayMessage.createValidator();
      expect(typeof validate).toBe('function');
    });

    test('should validate multiple times with reusable validator', () => {
      const validate = ArrayMessage.createValidator();
      const result1 = ArrayMessage.validate({
        data: ['first', 'array'],
        ajvValidatorFunction: validate
      });
      expect(result1.valid).toBe(true);
      
      const result2 = ArrayMessage.validate({
        data: ['second', 'array'],
        ajvValidatorFunction: validate
      });
      expect(result2.valid).toBe(true);
    });
  });

  describe('UnionMessage (union type)', () => {
    test('should marshal a string union member', () => {
      const testValue: UnionMessage.UnionMessage = 'Hello World';
      const serialized = UnionMessage.marshal(testValue);
      expect(serialized).toEqual('"Hello World"');
    });

    test('should marshal a number union member', () => {
      const testValue: UnionMessage.UnionMessage = 42;
      const serialized = UnionMessage.marshal(testValue);
      expect(serialized).toEqual('42');
    });

    test('should marshal an object union member', () => {
      // Plain objects work with marshal at runtime (it uses JSON.stringify for non-class instances)
      const testValue = { name: 'Test Object' } as UnionMessage.UnionMessage;
      const serialized = UnionMessage.marshal(testValue);
      expect(JSON.parse(serialized)).toEqual({ name: 'Test Object' });
    });

    test('should unmarshal a string union member', () => {
      const serialized = '"Hello World"';
      const result = UnionMessage.unmarshal(serialized);
      expect(result).toEqual('Hello World');
    });

    test('should unmarshal a number union member', () => {
      const serialized = '42';
      const result = UnionMessage.unmarshal(serialized);
      expect(result).toEqual(42);
    });

    test('should unmarshal an object union member', () => {
      const serialized = '{"name":"Test Object"}';
      const result = UnionMessage.unmarshal(serialized);
      expect(result).toEqual({ name: 'Test Object' });
    });

    test('should marshal and unmarshal string roundtrip', () => {
      const original: UnionMessage.UnionMessage = 'roundtrip test';
      const serialized = UnionMessage.marshal(original);
      const deserialized = UnionMessage.unmarshal(serialized);
      expect(deserialized).toEqual(original);
    });

    test('should marshal and unmarshal number roundtrip', () => {
      const original: UnionMessage.UnionMessage = 3.14159;
      const serialized = UnionMessage.marshal(original);
      const deserialized = UnionMessage.unmarshal(serialized);
      expect(deserialized).toEqual(original);
    });

    test('should marshal and unmarshal object roundtrip', () => {
      // Plain objects work with marshal/unmarshal at runtime
      const original = { name: 'roundtrip' } as UnionMessage.UnionMessage;
      const serialized = UnionMessage.marshal(original);
      const deserialized = UnionMessage.unmarshal(serialized);
      expect(deserialized).toEqual(original);
    });

    test('should validate object union member', () => {
      // oneOf validation: objects are one of the valid union members
      const result = UnionMessage.validate({
        data: { name: 'Test' }
      });
      expect(result.valid).toBe(true);
    });

    test('should validate empty object union member', () => {
      // Empty object should match the object schema with no required properties
      const result = UnionMessage.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    test('should validate object with name property', () => {
      const result = UnionMessage.validate({
        data: { name: 'John Doe' }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate boolean (not in union)', () => {
      // Boolean is not part of the union (string | number | object)
      const result = UnionMessage.validate({
        data: true
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate array (not in union)', () => {
      // Array is not part of the union
      const result = UnionMessage.validate({
        data: [1, 2, 3]
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate null (not in union)', () => {
      const result = UnionMessage.validate({
        data: null
      });
      expect(result.valid).toBe(false);
    });

    test('should provide validation function', () => {
      const validate = UnionMessage.createValidator();
      expect(typeof validate).toBe('function');
    });

    test('should validate multiple times with reusable validator for objects', () => {
      const validate = UnionMessage.createValidator();
      
      // Validate object 1
      const result1 = UnionMessage.validate({
        data: { name: 'test1' },
        ajvValidatorFunction: validate
      });
      expect(result1.valid).toBe(true);
      
      // Validate object 2
      const result2 = UnionMessage.validate({
        data: { name: 'test2' },
        ajvValidatorFunction: validate
      });
      expect(result2.valid).toBe(true);
      
      // Validate empty object
      const result3 = UnionMessage.validate({
        data: {},
        ajvValidatorFunction: validate
      });
      expect(result3.valid).toBe(true);
    });
  });

  describe('FindPetsByStatusAndCategoryResponse_200 (array of complex types)', () => {
    const testPet1 = new APet({
      name: 'Fluffy',
      photoUrls: ['http://example.com/fluffy.jpg'],
      id: 1,
      status: 'available'
    });
    
    const testPet2 = new APet({
      name: 'Buddy',
      photoUrls: ['http://example.com/buddy.jpg', 'http://example.com/buddy2.jpg'],
      id: 2,
      status: 'pending'
    });

    test('should marshal an array of APet instances', () => {
      const petsArray = [testPet1, testPet2];
      const serialized = FindPetsByStatusAndCategoryResponse_200.marshal(petsArray);
      const parsed = JSON.parse(serialized);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Fluffy');
      expect(parsed[1].name).toBe('Buddy');
    });

    test('should unmarshal and return proper APet instances with marshal method', () => {
      const jsonData = JSON.stringify([
        { name: 'Fluffy', photoUrls: ['http://example.com/fluffy.jpg'], id: 1, status: 'available' },
        { name: 'Buddy', photoUrls: ['http://example.com/buddy.jpg'], id: 2, status: 'pending' }
      ]);
      
      const result = FindPetsByStatusAndCategoryResponse_200.unmarshal(jsonData);
      
      // Verify it's an array with correct length
      expect(result).toHaveLength(2);
      
      // Verify items are proper APet instances with marshal method
      expect(typeof result[0].marshal).toBe('function');
      expect(typeof result[1].marshal).toBe('function');
      
      // Verify marshalling works on the unmarshalled instances
      const pet1Marshalled = result[0].marshal();
      expect(pet1Marshalled).toContain('Fluffy');
      
      const pet2Marshalled = result[1].marshal();
      expect(pet2Marshalled).toContain('Buddy');
    });

    test('should unmarshal from array and return proper APet instances', () => {
      const arrayData = [
        { name: 'Whiskers', photoUrls: ['http://example.com/whiskers.jpg'] },
        { name: 'Max', photoUrls: ['http://example.com/max.jpg'] }
      ];
      
      const result = FindPetsByStatusAndCategoryResponse_200.unmarshal(arrayData);
      
      // Verify items have getters and setters (instance properties)
      expect(result[0].name).toBe('Whiskers');
      expect(result[1].name).toBe('Max');
      
      // Verify items have marshal method
      expect(typeof result[0].marshal).toBe('function');
      expect(typeof result[1].marshal).toBe('function');
    });

    test('should marshal and unmarshal roundtrip correctly with proper instances', () => {
      const original = [testPet1, testPet2];
      const serialized = FindPetsByStatusAndCategoryResponse_200.marshal(original);
      const deserialized = FindPetsByStatusAndCategoryResponse_200.unmarshal(serialized);
      
      // Verify roundtrip preserves data
      expect(deserialized[0].name).toBe(testPet1.name);
      expect(deserialized[0].id).toBe(testPet1.id);
      expect(deserialized[1].name).toBe(testPet2.name);
      expect(deserialized[1].id).toBe(testPet2.id);
      
      // Verify deserialized items are proper instances with marshal method
      expect(typeof deserialized[0].marshal).toBe('function');
      expect(typeof deserialized[1].marshal).toBe('function');
      
      // Verify re-marshalling produces valid JSON
      const remarshalled = FindPetsByStatusAndCategoryResponse_200.marshal(deserialized);
      expect(JSON.parse(remarshalled)).toEqual(JSON.parse(serialized));
    });

    test('should handle empty array', () => {
      const emptyArray: FindPetsByStatusAndCategoryResponse_200.FindPetsByStatusAndCategoryResponse_200 = [];
      const serialized = FindPetsByStatusAndCategoryResponse_200.marshal(emptyArray);
      expect(serialized).toEqual('[]');
      
      const deserialized = FindPetsByStatusAndCategoryResponse_200.unmarshal(serialized);
      expect(deserialized).toEqual([]);
    });
  });
});
