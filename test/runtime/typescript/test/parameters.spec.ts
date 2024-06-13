import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';

describe('parameters', () => {
  const testObject = new UserSignedupParameters({
    myParameter: 'parameter'
  });
  test('be able to get correct channel', () => {
    const channelWithParameters = testObject.getChannelWithParameters('user.signedup.{my_parameter}');
    expect(channelWithParameters).toEqual(`user.signedup.${testObject.myParameter}`);
  });
});
