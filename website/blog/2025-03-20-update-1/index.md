---
slug: the-codegen-project
title: The Codegen Project:5 Months of Progress (Oct 2024 – Mar 2025)
authors: [jonaslagoni]
tags: [the-codegen-project]
---
It has been a while since the last update, almost 5 months to be exact, all these improvements have been happening while building the SDK platform with the CLI as it's pillars.

# The Codegen Project: 5 Months of Progress (Oct 2024 – Mar 2025)

The past five months have been a whirlwind for the CLI. Since our last update [in October 2024](https://the-codegen-project.org/blog/the-codegen-project), we've evolved the project with new features, expanded protocol support, crucial fixes, and improved documentation. Instead of just listing the changes, we want to share the journey of how we grew **The Codegen Project CLI** from version **0.23.0 to 0.33.0**.

## 🚀 Wrapping Up 2024: Headers & Stability

When we left off in October, the Codegen CLI was already powerful, but it soon gained an important new ability: **[TypeScript Headers Generation](https://github.com/the-codegen-project/cli/pull/159)**. This feature allowed us to generate **strongly-typed models** for message headers defined in AsyncAPI specs, alongside payload models. We introduced a new `headers` preset to produce header models for each channel, initially supporting AsyncAPI input and TypeScript output. Some of the next steps is integrating it into the `channels` and `client` presets for all the protocols like `payload`.

After adding this big feature, we focused on stability. In early November, we tackled an issue with **[weird payload generation](https://github.com/the-codegen-project/cli/pull/165)** that led to unexpected behaviors. This bugfix ensured that the CLI generated cleaner, more reliable output. Then, on December 1st, we performed a **[refactor and cleanup pass](https://github.com/the-codegen-project/cli/pull/167)**, resolving lingering issues and improving maintainability. With header generation in place and a wave of bug fixes, we ended 2024 on a solid foundation.

## 🔄 December: NATS Request-Reply Refactor

As the holiday season arrived, we turned our attention to **[NATS request/reply support](https://github.com/the-codegen-project/cli/pull/173)**. Previously, the CLI’s generation logic focused primarily on pub-sub, but **NATS’s request-reply pattern required a more operation-aware approach**. To achieve this, we refactored how the generator processes AsyncAPI operations, introducing **conditional channel functions** and an `asyncapiReverseOperations` flag to support flexible and complex scenarios.

The result? The CLI could now generate **request sender and response listener code** for NATS with correct message handling in both directions. Along the way, we fixed edge cases where response messages weren’t generated correctly, making NATS a much more powerful integration within Codegen. By December 21, these changes landed in **version 0.25.0**, wrapping up the year with a major protocol enhancement.

## 🌍 New Year, New Protocols: Kafka, MQTT, and AMQP

With 2025 underway, we set our sights on broadening protocol support. By mid-January, **[Kafka](https://github.com/the-codegen-project/cli/pull/177)**, **[MQTT](https://github.com/the-codegen-project/cli/pull/178)**, and **[AMQP](https://github.com/the-codegen-project/cli/pull/179)** all became part of the CLI’s repertoire.

These messaging protocols each have their own nuances—Kafka’s consumer groups, MQTT’s lightweight pub-sub model, and AMQP’s queue/exchange semantics. We carefully implemented support for each, ensuring the CLI could correctly generate code for these backends. By **version 0.28.0**, developers could generate TypeScript code for Kafka, MQTT, or AMQP streams using AsyncAPI, **expanding the CLI’s reach across the messaging ecosystem**.

## 📡 February: Event Sources & Function Types

In the platform we had the need to use **[Server-Sent Events (SSE)](https://github.com/the-codegen-project/cli/pull/182)** for our frontend live update functionality, which started in early February. The CLI could now generate both **Event Source clients (fetch) and servers (express)**, allowing users to describe real-time HTTP SSE endpoints in AsyncAPI and generate corresponding TypeScript implementations. This filled a key gap, making the CLI **not just for brokered messaging, but for real-time web streams as well**.

At the same time, we added **[custom function type mappings](https://github.com/the-codegen-project/cli/pull/185)**, enabling AsyncAPI **operations to influence function signatures**. This flexibility was particularly useful for advanced use cases—like tweaking request-reply functions or applying custom channel configurations. Shortly after, we made **[headers available for event-source messages](https://github.com/the-codegen-project/cli/pull/189)**, ensuring consistency across protocols.

By the end of February, **The Codegen Project CLI had become more versatile than ever**, with structured headers, powerful function mappings, and robust SSE support.

## 🛠️ March: Documentation, Queue Subscriptions & a Generator Rewrite

With many major features shipped, March was about polishing the experience and tying up loose ends. We gave our **[documentation a major overhaul](https://github.com/the-codegen-project/cli/pull/191)**, updating guides and examples to ensure new features were easy to understand and use. The refreshed AsyncAPI usage guide, headers guide, and AMQP guide made it easier than ever to adopt the CLI’s latest capabilities.

On the development side, we fine-tuned **[AMQP queue subscriptions](https://github.com/the-codegen-project/cli/pull/193)**, ensuring seamless consumer binding to durable queues. Finally, we conducted a **[complete rewrite of the channel generator logic](https://github.com/the-codegen-project/cli/pull/195)**—not to add a new feature, but to **clean up and streamline how each channel is processed**. This refactor eliminated redundancies, improved maintainability, and laid the groundwork for future enhancements.

---

## 🎯 Wrapping Up: A More Powerful Codegen CLI

Looking back, **the period from October 2024 to March 2025 has been one of remarkable growth**. We've transformed the CLI into a **multi-protocol powerhouse**, supporting **Kafka, MQTT, AMQP, NATS (including request/reply), and SSE**. Features like **typed headers, customizable function types, and detailed documentation** have made it more robust and developer-friendly than ever.

These last five months have been about **eating your own tool** while we have been working on the SDK platform. Whether you're working with pub-sub, request-reply, or real-time streaming, Codegen now has you covered or will in the future. And with our recent generator refactor, we're well-positioned to keep improving and innovating in the months ahead.

Thanks for following along—we’re excited to see what the next chapter brings! 🚀


<!-- 🚀 5 Months of Progress: The Codegen Project CLI Just Got Even Better! 🔥

Since our last update, we’ve been heads down, pushing Codegen to new heights. Here’s what’s new:

✅ Kafka, MQTT & AMQP Support – Generate TypeScript clients for even more messaging protocols!
✅ NATS Request-Reply – Fully support request-response patterns in NATS!
✅ Server-Sent Events (SSE) – Generate real-time event streaming client & server functions!
✅ Typed Headers Everywhere – Strongly-typed header models for all protocols!
✅ Custom Function Types – More flexibility in how generated functions behave!
✅ Huge Generator Refactor – Faster, cleaner, and ready for the future!

Oh, and we’ve revamped the docs to make getting started easier than ever. 📖✨

We’re incredibly proud of how far The Codegen Project has come, and we’re just getting started. Read the full journey here: [link to blog post]

#opensource #developer #asyncapi #typescript #codegeneration -->