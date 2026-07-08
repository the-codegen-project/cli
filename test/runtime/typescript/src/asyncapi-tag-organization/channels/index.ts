import * as internal_nats from './nats';

export const nats = {
  user: {
    publishToSendUserSignedup: internal_nats.publishToSendUserSignedup,
    jetStreamPublishToSendUserSignedup: internal_nats.jetStreamPublishToSendUserSignedup,
    subscribeToReceiveUserSignedup: internal_nats.subscribeToReceiveUserSignedup,
    jetStreamPullSubscribeToReceiveUserSignedup: internal_nats.jetStreamPullSubscribeToReceiveUserSignedup,
    jetStreamPushSubscriptionFromReceiveUserSignedup: internal_nats.jetStreamPushSubscriptionFromReceiveUserSignedup
  },
  admin: {
    publishToSendAdminAlert: internal_nats.publishToSendAdminAlert,
    jetStreamPublishToSendAdminAlert: internal_nats.jetStreamPublishToSendAdminAlert
  },
  untagged: {
    publishToSendSystemPing: internal_nats.publishToSendSystemPing,
    jetStreamPublishToSendSystemPing: internal_nats.jetStreamPublishToSendSystemPing
  }
} as const;
