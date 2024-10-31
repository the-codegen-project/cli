import { UserSignedUpHeaders } from '../src/headers/UserSignedupHeaders';

describe('headers', () => {  
  const testObject = new UserSignedUpHeaders({
    email: 'emailTest',
    displayName: 'displayNameTest'
  });
  test('be able to serialize model', () => {
    const serialized = testObject.marshal();
    expect(serialized).toEqual("{\"display_name\": \"displayNameTest\",\"email\": \"emailTest\"}");
  });
  test('be able to serialize model and turning it back to a model with the same values', () => {
    const serialized = testObject.marshal();
    const newAddress = UserSignedUpHeaders.unmarshal(serialized);
    expect(serialized).toEqual(newAddress.marshal());
  });
});
