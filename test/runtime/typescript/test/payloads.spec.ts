import { UserSignedUp } from '../src/payloads/UserSignedUp';

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
      const result = testObject.validate({
        data: {
          display_name: 'Test User',
          email: 'test@example.com'
        }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate incorrect email format', () => {
      const result = testObject.validate({
        data: {
          display_name: 'Test User',
          email: 'invalid-email'
        }
      });
      expect(result.valid).toBe(false);
    });

    test('should provide validation function', () => {
      const result = testObject.validate({
        data: {}
      });
      expect(typeof result.validateFunction).toBe('function');
    });

    test('should be able to validate multiple times', () => {
      const result = testObject.validate({
        data: {
          display_name: 'Test User',
          email: 'test@example.com'
        }
      });
      expect(result.valid).toBe(true);
      expect(result.validateFunction({
        display_name: 'Test User',
        email: 'test@example.com'
      })).toBe(true);
      
    });
  });
});
