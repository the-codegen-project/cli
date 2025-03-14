---
sidebar_position: 99
---

# NATS
[NATS](https://nats.io/) is an open-source, high-performance messaging system designed for cloud-native and IoT applications. It stands out for its simplicity, lightweight architecture, and ultra-low latency messaging​. NATS supports multiple messaging patterns (publish-subscribe, request-reply, and even distributed queueing) without heavy setup. In The Codegen CLI, NATS was one of the first supported protocols, with generators that produce TypeScript code for core pub/sub as well as JetStream (persisted streaming) features​. This makes it easy to generate type-safe publishers and subscribers for NATS subjects (topics) and even take advantage of JetStream’s durability when needed.

Here is what is currently available through the generators ([channels](../generators/channels.md) and [client](../generators/client.md)):

| **Languages** | Core publish | Core subscribe | JetStream publish | JetStream pull subscribe | JetStream push subscription
|---|---|---|---|---|---|
| TypeScript | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

All of this is available through [AsyncAPI](../inputs/asyncapi.md).
