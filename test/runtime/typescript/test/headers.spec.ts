import { UserSignedUpHeaders } from '../src/headers/UserSignedUpHeaders';

describe('headers', () => {  
  const testObject = new UserSignedUpHeaders({
    xTestHeader: 'emailTest'
  });
  test('be able to serialize model', () => {
    const serialized = testObject.marshal();
    expect(serialized).toEqual("{\"x-test-header\": \"emailTest\"}");
  });
  test('be able to serialize model and turning it back to a model with the same values', () => {
    const serialized = testObject.marshal();
    const newAddress = UserSignedUpHeaders.unmarshal(serialized);
    expect(serialized).toEqual(newAddress.marshal());
  });
});
