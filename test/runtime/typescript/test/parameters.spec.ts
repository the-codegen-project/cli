import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';

describe('parameters', () => {
  const testObject = new UserSignedupParameters({
    myParameter: 'parameter',
    enumParameter: 'asyncapi'
  });
  test('getChannelWithParameters should return correct channel', () => {
    const channelWithParameters = testObject.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}');
    expect(channelWithParameters).toEqual(`user.signedup.${testObject.myParameter}.${testObject.enumParameter}`);
  });
  test('be able to get correct channel', () => {
    const parameter = UserSignedupParameters.createFromChannel('user.signedup.test_my_parameter.asyncapi', 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/);
    expect(parameter.enumParameter).toEqual('asyncapi');
    expect(parameter.myParameter).toEqual('test_my_parameter');
  });
});
