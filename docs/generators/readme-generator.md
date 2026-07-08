---
sidebar_position: 99
---

# Readme

```js
export default {
  ...,
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__/channels',
      language: 'typescript',
      protocols: ['nats']
    },
    {
      preset: 'readme',
      outputPath: '.',
      language: 'typescript',
      packageName: '@my-org/my-sdk',
      packageVersion: '1.0.0',
      dependencies: ['channels-typescript']
    }
  ]
};
```

The `readme` preset generates a `README.md` that documents how to **install** and **use** the generated code. The usage sections are derived from the other generators you configured, so the README always matches what was actually generated: a types-only project documents its types, a project with channels documents its channel functions, a project with a client documents the client, and so on.

This is supported through the following inputs: [`asyncapi`](../inputs/asyncapi.md), [`openapi`](../inputs/openapi.md)

It supports the following languages; [`typescript`](#typescript)

## What it generates

The README is assembled from the following parts, in order:

1. **Introduction** (optional) — the `introduction` option, rendered verbatim at the top above a horizontal rule.
2. **Title & version** — `# {packageName}` followed by the `packageVersion`.
3. **Install** — `npm` / `yarn` / `pnpm` install commands. Only rendered when `packageName` is set.
4. **Usage** — one subsection per documented generator (see below).
5. **Suffix** — the `suffix` option, or a default attribution line naming The Codegen Project CLI and its version.

### Usage sections

The generator inspects the render output of the generators referenced through the ID options and renders a usage subsection for each one whose output is available:

- **HTTP operations** — from the `channels` generator's `http_client` protocol functions.
- **Messaging protocols** (NATS, Kafka, MQTT, AMQP, EventSource, WebSocket) — from the `channels` generator's per-protocol functions.
- **Client** — from the `client` generator (`NatsClient`).
- **Message payloads** — from the `payloads` generator's models.
- **Types** — from the `types` generator.

> **Dependencies matter.** A usage section is only rendered when the referenced generator's output is present when the README renders. Because the README does **not** auto-inject other generators, you must list every referenced generator ID in the `dependencies` array so it is rendered first. For example, to document channel functions, add `dependencies: ['channels-typescript']`.

## Options

| Option | Description |
|---|---|
| `packageName` | The npm package name the generated code is published as. Enables the install section and package-based imports in examples. When omitted, imports use paths relative to the generator output directories. |
| `packageVersion` | The version shown below the title. |
| `introduction` | Custom Markdown placed at the top, above the generated content. |
| `suffix` | Custom Markdown appended as the final section. When omitted, a CLI attribution line is rendered. |
| `channelsGeneratorId` | ID of the `channels` generator to document. Default `channels-typescript`. |
| `payloadsGeneratorId` | ID of the `payloads` generator to document. Default `payloads-typescript`. |
| `typesGeneratorId` | ID of the `types` generator to document. Default `types-typescript`. |
| `clientGeneratorId` | ID of the `client` generator to document. Default `client-typescript`. |

## TypeScript

The README is written as Markdown and its content is language-independent, but the usage examples are rendered in TypeScript matching the generated code.
