export type Topics = 'user/signedup/{my_parameter}/{enum_parameter}' | 'noparameters' | 'string/payload' | 'array/payload' | 'union/payload';
export type TopicIds = 'userSignedup' | 'noParameter' | 'stringPayload' | 'arrayPayload' | 'unionPayload';
export function ToTopicIds(topic: Topics): TopicIds {
  switch (topic) {
    case 'user/signedup/{my_parameter}/{enum_parameter}':
    return 'userSignedup';
  case 'noparameters':
    return 'noParameter';
  case 'string/payload':
    return 'stringPayload';
  case 'array/payload':
    return 'arrayPayload';
  case 'union/payload':
    return 'unionPayload';
    default:
      throw new Error('Unknown topic: ' + topic);
  }
}
export function ToTopics(topicId: TopicIds): Topics {
  switch (topicId) {
    case 'userSignedup':
    return 'user/signedup/{my_parameter}/{enum_parameter}';
  case 'noParameter':
    return 'noparameters';
  case 'stringPayload':
    return 'string/payload';
  case 'arrayPayload':
    return 'array/payload';
  case 'unionPayload':
    return 'union/payload';
    default:
      throw new Error('Unknown topic ID: ' + topicId);
  }
}
export const TopicsMap: Record<TopicIds, Topics> = {
  'userSignedup': 'user/signedup/{my_parameter}/{enum_parameter}', 
  'noParameter': 'noparameters', 
  'stringPayload': 'string/payload', 
  'arrayPayload': 'array/payload', 
  'unionPayload': 'union/payload'
};
