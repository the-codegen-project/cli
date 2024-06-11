import { Root } from '../src/payloads/Root';

describe('payloads', () => {
  describe('should be able to serialize and deserialize the model', () => {
    const testObject = new Root({
      email: 'emailTest',
      displayName: 'displayNameTest'
    });
    test('be able to serialize model', () => {
      const serialized = testObject.marshal();
      expect(serialized).toEqual("{\"display_name\": \"displayNameTest\",\"email\": \"emailTest\"}");
    });
    test('be able to serialize model and turning it back to a model with the same values', () => {
      const serialized = testObject.marshal();
      const newAddress = Root.unmarshal(serialized);
      expect(serialized).toEqual(newAddress.marshal());
    });
  });
});
