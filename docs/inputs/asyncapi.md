---
sidebar_position: 99
---

# AsyncAPI
Supported versions: 2.0 -> 3.0

If you arrive from the AsyncAPI community, you might be wondering what this project is and how does it relate?

The Codegen Project was started because of a need for a code generator that;
1. could easily be integrated into development workflows
2. can easily be extended or customized to specific use-cases
3. forms a community across communities in languages and standards
4. are financially sustainable long term through open source at it's core.

There is a lot of overlap with existing tooling, however the idea is to form the same level of quality that the OpenAPI Generator provides to OpenAPI community for HTTP, for AsyncAPI and **any** protocol (including HTTP), and the usability of the Apollo GraphQL generator. How are we gonna achieve it? Together, and a [roadmap](https://github.com/orgs/the-codegen-project/projects/1/views/2).

Enabled extensions:
To customize the code generation through the AsyncAPI document, use the `x-the-codegen-project` [extension object](https://www.asyncapi.com/docs/reference/specification/v3.0.0#specificationExtensions) with the following properties:

### Channel

`channelName`, string, customize the name of the functions generated for the channel, use this to overwrite the automatically determined name for models and functions. This will be used by the following generators; [payloads](../generators/payloads.md), [parameters](../generators/parameters.md) and [channels](../generators/channels.md). 
`functionTypeMapping`, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes)[], customize which generators to generate for the given channel, use this to specify further which functions we render. This will be used by the following generators; [channels](../generators/channels.md). 

```json
{
  "asyncapi": "3.0.0",
  ...,
  "channels": {
    "test-channel": {
      "x-the-codegen-project": {
        "channelName": "Test",
        "functionTypeMapping": ["event_source_express"]
      }
    }
  }
}
```

### Operation

`functionTypeMapping`, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes)[], customize which generators to generate for the given operator, use this to specify further which functions we render. This will be used by the following generators; [channels](../generators/channels.md). 

```json
{
  "asyncapi": "3.0.0",
  ...,
  "operation": {
    "test-operation": {
      "x-the-codegen-project": {
        "functionTypeMapping": ["event_source_express"]
      }
    }
  }
}
```

## FAQ

### How does it relate to AsyncAPI Generator and templates?
It is fairly similar in functionality except in some key areas.

Templates are similar to presets except you can bind presets together to make it easier to render code down stream.

The AsyncAPI Generator is like the core of the Codegen Project, however it does not enable different inputs than AsyncAPI documents. 