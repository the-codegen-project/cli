import * as internal_nats from './nats';

export const nats = {
  user: {
    signedup: {
      publishToSendUserSignedup: internal_nats.publishToSendUserSignedup,
      jetStreamPublishToSendUserSignedup: internal_nats.jetStreamPublishToSendUserSignedup,
      subscribeToReceiveUserSignedup: internal_nats.subscribeToReceiveUserSignedup,
      jetStreamPullSubscribeToReceiveUserSignedup: internal_nats.jetStreamPullSubscribeToReceiveUserSignedup,
      jetStreamPushSubscriptionFromReceiveUserSignedup: internal_nats.jetStreamPushSubscriptionFromReceiveUserSignedup
    }
  },
  noparameters: {
    publishToNoParameter: internal_nats.publishToNoParameter,
    subscribeToNoParameter: internal_nats.subscribeToNoParameter,
    jetStreamPullSubscribeToNoParameter: internal_nats.jetStreamPullSubscribeToNoParameter,
    jetStreamPushSubscriptionFromNoParameter: internal_nats.jetStreamPushSubscriptionFromNoParameter,
    jetStreamPublishToNoParameter: internal_nats.jetStreamPublishToNoParameter
  },
  string: {
    payload: {
      publishToSendStringPayload: internal_nats.publishToSendStringPayload,
      jetStreamPublishToSendStringPayload: internal_nats.jetStreamPublishToSendStringPayload,
      subscribeToReceiveStringPayload: internal_nats.subscribeToReceiveStringPayload,
      jetStreamPullSubscribeToReceiveStringPayload: internal_nats.jetStreamPullSubscribeToReceiveStringPayload,
      jetStreamPushSubscriptionFromReceiveStringPayload: internal_nats.jetStreamPushSubscriptionFromReceiveStringPayload
    }
  },
  array: {
    payload: {
      publishToSendArrayPayload: internal_nats.publishToSendArrayPayload,
      jetStreamPublishToSendArrayPayload: internal_nats.jetStreamPublishToSendArrayPayload,
      subscribeToReceiveArrayPayload: internal_nats.subscribeToReceiveArrayPayload,
      jetStreamPullSubscribeToReceiveArrayPayload: internal_nats.jetStreamPullSubscribeToReceiveArrayPayload,
      jetStreamPushSubscriptionFromReceiveArrayPayload: internal_nats.jetStreamPushSubscriptionFromReceiveArrayPayload
    }
  },
  union: {
    payload: {
      publishToSendUnionPayload: internal_nats.publishToSendUnionPayload,
      jetStreamPublishToSendUnionPayload: internal_nats.jetStreamPublishToSendUnionPayload,
      subscribeToReceiveUnionPayload: internal_nats.subscribeToReceiveUnionPayload,
      jetStreamPullSubscribeToReceiveUnionPayload: internal_nats.jetStreamPullSubscribeToReceiveUnionPayload,
      jetStreamPushSubscriptionFromReceiveUnionPayload: internal_nats.jetStreamPushSubscriptionFromReceiveUnionPayload
    }
  },
  legacy: {
    notification: {
      publishToSendLegacyNotification: internal_nats.publishToSendLegacyNotification,
      jetStreamPublishToSendLegacyNotification: internal_nats.jetStreamPublishToSendLegacyNotification,
      subscribeToReceiveLegacyNotification: internal_nats.subscribeToReceiveLegacyNotification,
      jetStreamPullSubscribeToReceiveLegacyNotification: internal_nats.jetStreamPullSubscribeToReceiveLegacyNotification,
      jetStreamPushSubscriptionFromReceiveLegacyNotification: internal_nats.jetStreamPushSubscriptionFromReceiveLegacyNotification
    }
  }
} as const;
