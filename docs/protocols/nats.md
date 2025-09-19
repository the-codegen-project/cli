---
sidebar_position: 99
---

# NATS

[NATS is an open-source, high-performance messaging system designed for cloud-native, distributed systems, and Internet of Things (IoT) applications](https://nats.io/). Developed by Synadia, NATS stands out for its simplicity, lightweight architecture, and low latency, making it ideal for real-time messaging. It supports a variety of messaging patterns including publish-subscribe, request-reply, and queueing. 

It is one of the first protocols for The Codegen Project to support, here is what is currently available through the generators ([channels](../generators/channels.md) and [client](../generators/client.md)):

| **Languages** | Core publish | Core subscribe | JetStream publish | JetStream pull subscribe | JetStream push subscription
|---|---|---|---|---|---|
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).
