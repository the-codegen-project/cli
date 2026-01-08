import { UserSignedUp } from '../src/payloads/UserSignedUp';
import * as StringMessage from '../src/payloads/StringMessage';
import * as ArrayMessage from '../src/payloads/ArrayMessage';
import * as UnionMessage from '../src/payloads/UnionMessage';

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

    test('should validate correct string payload (as JSON string)', () => {
      // When passing data as a string, it must be valid JSON (i.e., the marshalled form)
      const result = StringMessage.validate({
        data: '"Hello World"'
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

    test('should provide validation function', () => {
      const validate = StringMessage.createValidator();
      expect(typeof validate).toBe('function');
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

    test('should validate correct array payload', () => {
      const result = ArrayMessage.validate({
        data: ['item1', 'item2']
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate array with wrong item types', () => {
      const result = ArrayMessage.validate({
        data: [1, 2, 3]  // Numbers instead of strings
      });
      expect(result.valid).toBe(false);
    });

    test('should provide validation function', () => {
      const validate = ArrayMessage.createValidator();
      expect(typeof validate).toBe('function');
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

    test('should validate object union member', () => {
      // oneOf validation: objects are one of the valid union members
      const result = UnionMessage.validate({
        data: { name: 'Test' }
      });
      expect(result.valid).toBe(true);
    });

    test('should provide validation function', () => {
      const validate = UnionMessage.createValidator();
      expect(typeof validate).toBe('function');
    });
  });
});
