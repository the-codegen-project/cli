# AsyncAPI

If you arrive from the AsyncAPI community, you might be wondering what is this project and how does it relate?

The Codegen Project was started because of a need for a code generator that;
1. could easily be integrated into development workflows
2. can easily be extended or customized to specific use-cases
3. forms a community across communities in languages and standards
4. are financially sustainable long term

This includes for the AsyncAPI specification.

There is a lot of overlap with existing tooling, however the idea is to form the same level of quality that the OpenAPI Generator provides to OpenAPI community and HTTP, for AsyncAPI and **any** protocol (including HTTP). How are we gonna achieve it? Together, and a [roadmap](https://github.com/orgs/the-codegen-project/projects/1/views/2).

## FAQ

### How does it relate to AsyncAPI Generator and templates?
It is fairly similar in functionality except in some key areas.

Templates are similar to presets except you can bind presets together to make it easier to render code down stream.

The AsyncAPI Generator is like the core of the Codegen Project, however it does not enable different inputs than AsyncAPI documents. 