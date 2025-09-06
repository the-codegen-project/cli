export type Topics = 'user/signedup/{my_parameter}/{enum_parameter}' | 'noparameters';
export type TopicIds = 'userSignedup' | 'noParameter';
export function ToTopicIds(topic: Topics): TopicIds {
  switch (topic) {
    case 'user/signedup/{my_parameter}/{enum_parameter}':
    return 'userSignedup';
  case 'noparameters':
    return 'noParameter';
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
    default:
      throw new Error('Unknown topic ID: ' + topicId);
  }
}
