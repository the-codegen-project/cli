---
slug: asyncapi-customizing-outputs
title: Customizing Code Generation with AsyncAPI Extensions
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, customization]
---

The Codegen Project provides several ways to customize the generated code output through AsyncAPI extensions. In this post, we'll explore the available customization options and how to use them effectively.

## Channel naming

The `channelName` extension property allows you to override the default naming conventions used by the generator. This is particularly useful in several scenarios:

1. When working with AsyncAPI 2.x documents where channel names are derived from addresses
2. When you want to enforce specific naming conventions in your codebase
3. When the auto-generated names don't match your team's preferences

```yaml
asyncapi: 3.0.0
channels:
  user-events:
    address: user/signedup/v1
    x-the-codegen-project:
      # Override the auto-generated channel name
      channelName: UserEvents
```

The `channelName` property affects several aspects of code generation:

- Function names (e.g., `publishToUserEvents`, `subscribeToUserEvents`)
- Model class names (e.g., `UserEventsPayload`, `UserEventsParameters`)
- Type definitions and interfaces
- File names for generated code

This is primarily used for `channels` and `client` generators as they generate helper functions, and `payload`, `parameters`, and `headers` model names.

## Function type mapping

The `functionTypeMapping` property allows you to specify which types of protocol functions should be generated for a channel. For example for event source, you have the option to define:
- `event_source_fetch` - Generate EventSource client functions using fetch
- `event_source_express` - Generate EventSource server functions for express servers

The reason why this extension is needed, especially for channels, is because there is no other way to specify what protocol functions you need. In conjunction with operations, this means that if multiple different types of protocol functions are available, you can selectively decide which ones are relevant.

See the full list here: https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes

Example usage:
```yaml
asyncapi: 3.0.0
channels:
  user-events:
    x-the-codegen-project:
      functionTypeMapping: 
        - event_source_fetch
```

With the corresponding configuration:

```js
export default {
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/',
      language: 'typescript',
      protocols: ['event_source'],
      asyncapiGenerateForOperations: false
    }
  ]
};
```
It will only generate event source fetch (client) functions for that specific channel.

As mentioned earlier, this can also be defined for operations, the same as for channels. Here specifying event source does not make much sense, but for something like NATS, you can specify whether it's for JetStream or core NATS:

```yaml
asyncapi: 3.0.0
operations:
  publishUserEvent:
    x-the-codegen-project:
      functionTypeMapping: 
        - nats_jetstream_publish
```
With the corresponding configuration:

```js
export default {
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/',
      language: 'typescript',
      protocols: ['nats']
    }
  ]
};
```

## Future?

There will probably in the future be a unification of these extensions, as all code generations mature and can benefit from these types of extensions.

For now, The Codegen Project's extensions will provide a robust foundation for allowing you to customize the generated code even further. In the future, we will definitely also see more extensions emerge as more use cases get uncovered.

Remember to check the [official documentation](https://the-codegen-project.org/docs/) for the latest updates and additional customization options as they become available.

I will also make sure to update you whenever extensions come to life.