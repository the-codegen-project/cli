import { Topics, ToTopics, ToTopicIds, TopicIds } from '../src/Types';

describe('types', () => { 
  describe('ToTopics', () => {
    test('should be able to go from userSignedup to address', () => {
      const expectedTopic: Topics = 'user/signedup/{my_parameter}/{enum_parameter}';
      expect(ToTopics('userSignedup')).toEqual(expectedTopic);
    });
    test('should be able to go from noParameter to address', () => {
      const expectedTopic: Topics = 'noparameters';
      expect(ToTopics('noParameter')).toEqual(expectedTopic);
    });
    test('should throw error when unknown topic id', () => {
      expect(() => {
        ToTopics('asd' as any);
      }).toThrow();
    });
  });
  describe('ToTopicIds', () => {
    test('should be able to go from user/signedup/{my_parameter}/{enum_parameter} to id', () => {
      const expectedTopicId: TopicIds = 'userSignedup';
      expect(ToTopicIds('user/signedup/{my_parameter}/{enum_parameter}')).toEqual(expectedTopicId);
    });
    test('should be able to go from noParameter to id', () => {
      const expectedTopicId: TopicIds = 'noParameter';
      expect(ToTopicIds('noparameters')).toEqual(expectedTopicId);
    });
    test('should throw error when unknown address', () => {
      expect(() => {
        ToTopics('asd' as any);
      }).toThrow();
    });
  });
});
