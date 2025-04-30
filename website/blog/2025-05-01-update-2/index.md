---
slug: update-2
title: The Codegen Project - 1 Months of Progress
authors: [jonaslagoni]
tags: [the-codegen-project]
---

# The Codegen Project: 1 Months of Progress (Mar 2024 – Apr 2025)

Since the release of `v0.33`, we've been diligently enhancing the Codegen CLI to make generated code safer, more intuitive, and aligned with real-world development practices. Spanning versions `v0.34.0` through `v0.39.0`, this update introduces significant improvements, including **automatic payload validation enabled by default** and **unified parameters**.

**TLDR:**
- Automatic payload validation by default for all consumed messages
- Changed to unified parameter objects for all functions (breaking change)
- Improved TypeScript types and logging
- Updated documentation and fixed various bugs

<!-- truncate -->

## Payload Validation by Default

A cornerstone of this update is the **automatic payload validation** feature for the `channel` and `client` generators. Now, every message consumed message is validated against its schema using the AJV JSON Schema validator. This ensures that only well-formed messages are processed, enhancing the reliability of your services.

For instance, attempting to consume a message not conforming to the schema, will return a validation error:

```ts
await subscribeToUserSignedup({
  onDataCallback: (err, msg) => {
    if(err) return console.error(err);
    // Continue doing what you want
  }
});
```
This validation is seamlessly integrated across all supported protocols - NATS, Kafka, AMQP, MQTT, and EventSource. While it's enabled by default, you can opt out using the `skipMessageValidation` flag when necessary.

Beyond that, if you just use the `payloads` generator, [you can directly use the validation feature](/docs/generators/payloads#validation).

## Unified Parameters
Alongside validation, we’ve streamlined how you interact with the generated clients and channel APIs. All functions — whether subscribing to messages or publishing them — now accept a single options object. This replaces the old style of passing multiple positional arguments, which could become unwieldy and error-prone as more parameters were added.

Where you previously had to write:
```ts
await publishToSendUserSignedup(message, parameters, connection);
```

you now write:
```ts
await publishToSendUserSignedup({ message, parameters, connection });
```

This change makes generated code cleaner, easier to read, and more future-proof. Adding new options like validation toggles or runtime configs no longer forces breaking changes to the function signature. It also aligns better with modern JavaScript and TypeScript practices, where objects are preferred for configuration and function input.

Naturally, this is a breaking change if you’ve generated clients using earlier versions of the CLI. But we’ve updated the documentation with before/after code samples and a [new migration guide](/docs/migrations/v0#functions-parameters) to make the transition painless.

## Smarter Logs, Sharper Types

Improving the runtime experience doesn’t stop at validation. We’ve also refined our logging output to be more concise and informative. Error messages now tell you exactly what’s missing or invalid, and log output during code generation is easier to scan. The CLI feels more polished as a result.

Under the hood, we took care to strengthen the TypeScript types that power both the generator and the generated output. These type improvements catch issues earlier and provide better autocompletion and type safety in your editor. It’s a quieter kind of upgrade, but one that makes every project feel more solid.

## Docs, Fixes, and Behind-the-Scenes Polish

The improvements in this release go beyond features. We’ve also spent time fixing edge-case bugs, updating our dependencies, and tightening up the release pipeline. A longstanding issue that prevented some website updates from appearing after new releases has been resolved — so the docs you read will always match the CLI version you’re using.

We’ve added clearer error handling when required inputs (like an AsyncAPI document) are missing, smoothed out some inconsistencies in template output, and improved how empty payloads and unusual channel names are handled in generated code.

You’ll also find updated documentation throughout — especially around the new payload validation behavior and the object-style function parameters. These updates ensure that as the CLI evolves, learning and adopting the new workflows is as smooth as possible.

---

This release marks a turning point for Codegen CLI: your generated clients are now not only protocol-aware, but schema-aware by default. We’re excited about what this enables — safer microservices, more reliable messaging, and less defensive coding on your part.

Give v0.39.0 a try, and as always, let us know how we can keep making Codegen better.

Until next time, happy coding!