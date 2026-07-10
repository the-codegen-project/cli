import * as internal_nats from './nats';

export const nats = {
  user: {
    signedup: {
      publish: internal_nats.publishToSendUserSignedup,
      jetStreamPublish: internal_nats.jetStreamPublishToSendUserSignedup,
      subscribe: internal_nats.subscribeToReceiveUserSignedup,
      jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToReceiveUserSignedup,
      jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromReceiveUserSignedup
    }
  },
  noparameters: {
    publish: internal_nats.publishToNoParameter,
    subscribe: internal_nats.subscribeToNoParameter,
    jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToNoParameter,
    jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromNoParameter,
    jetStreamPublish: internal_nats.jetStreamPublishToNoParameter
  },
  string: {
    payload: {
      publish: internal_nats.publishToSendStringPayload,
      jetStreamPublish: internal_nats.jetStreamPublishToSendStringPayload,
      subscribe: internal_nats.subscribeToReceiveStringPayload,
      jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToReceiveStringPayload,
      jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromReceiveStringPayload
    }
  },
  array: {
    payload: {
      publish: internal_nats.publishToSendArrayPayload,
      jetStreamPublish: internal_nats.jetStreamPublishToSendArrayPayload,
      subscribe: internal_nats.subscribeToReceiveArrayPayload,
      jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToReceiveArrayPayload,
      jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromReceiveArrayPayload
    }
  },
  union: {
    payload: {
      publish: internal_nats.publishToSendUnionPayload,
      jetStreamPublish: internal_nats.jetStreamPublishToSendUnionPayload,
      subscribe: internal_nats.subscribeToReceiveUnionPayload,
      jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToReceiveUnionPayload,
      jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromReceiveUnionPayload
    }
  },
  legacy: {
    notification: {
      publish: internal_nats.publishToSendLegacyNotification,
      jetStreamPublish: internal_nats.jetStreamPublishToSendLegacyNotification,
      subscribe: internal_nats.subscribeToReceiveLegacyNotification,
      jetStreamPullSubscribe: internal_nats.jetStreamPullSubscribeToReceiveLegacyNotification,
      jetStreamPushSubscribe: internal_nats.jetStreamPushSubscriptionFromReceiveLegacyNotification
    }
  }
} as const;
