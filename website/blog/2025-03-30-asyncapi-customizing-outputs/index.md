---
slug: asyncapi-customizing-outputs
title: Customizing Code Generation with AsyncAPI Extensions
authors: [jonaslagoni]
tags: [the-codegen-project, asyncapi, customization]
---

The Codegen Project provides several ways to customize the generated code output through AsyncAPI extensions. In this post, we'll explore the available customization options and how to use them effectively.

## Channel Customization

The channel extension allows you to customize how individual channels are processed during code generation.

### Channel naming

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

This is primarily used for `channels` and `client` generator as they generate helper functions, and `payload`, `parameters` and `headers` model names.

### Function type mapping

The `functionTypeMapping` property allows you to specify which types of functions should be generated for a channel. For example for event source, you have the option to define:
- `event_source_fetch` - Generate EventSource client functions using fetch
- `event_source_express` - Generate EventSource server functions for express servers

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
Will only generate event source fetch (client) functions for that specific channel.

## Operation Customization

Operations can be customized to control which function types are generated, same as for channels:

```yaml
asyncapi: 3.0.0
operations:
  publishUserEvent:
    x-the-codegen-project:
      functionTypeMapping: 
        - event_source_express
```
With the corresponding configuration:

```js
export default {
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/',
      language: 'typescript',
      protocols: ['event_source']
    }
  ]
};
```

Will only generate event source fetch (client) functions for that specific operation.

## Future?
There are definitely use-cases where the extensions make sense, and by using these customization options, you can fine-tune the generated code to match your specific requirements.

There will definitely be 