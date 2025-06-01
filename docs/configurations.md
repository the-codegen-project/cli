---
sidebar_position: 4
---

# Configurations

There are 5 possible configuration file types, `json`, `yaml`, `esm` (ECMAScript modules JavaScript), `cjs` (CommonJS modules JavaScript) and `ts` (TypeScript).

The only difference between them is what they enable you to do. The difference is `callbacks`, in a few places, you might want to provide a callback to control certain behavior in the generation library.

For example, with the [`custom`](./generators/custom.md) generator, you provide a callback to render something, this is not possible if your configuration file is either `json` or `yaml` format.

Reason those two exist, is because adding a `.js` configuration file to a Java project, might confuse developers, and if you dont need to take advantage of the customization features that require callback, it will probably be better to use one of the other two.

## Creating Configurations with the CLI

The easiest way to create a configuration file is by using the `codegen init` command. This interactive command will guide you through setting up a configuration file for your project, allowing you to specify:

- Input file (AsyncAPI or OpenAPI document)
- Configuration file type (`esm`, `json`, `yaml`, `ts`)
- Output directory
- Language and generation options

```sh
codegen init --input-file ./ecommerce.yml --input-type asyncapi --config-type ts --languages typescript
```

For detailed usage instructions and all available options, see the [CLI usage documentation](./usage.md#codegen-init).

## Configuration File Lookup

If no explicit configuration file is sat, it will be looked for in the following order:
- package.json
- .codegenrc
- .codegenrc.json
- .codegenrc.yaml
- .codegenrc.yml
- .codegenrc.js
- .codegenrc.ts
- .codegenrc.cjs
- .config/codegenrc
- .config/codegenrc.json
- .config/codegenrc.yaml
- .config/codegenrc.yml
- .config/codegenrc.js
- .config/codegenrc.ts
- .config/codegenrc.mjs
- .config/codegenrc.cjs
- codegen.config.js
- codegen.config.ts
- codegen.config.mjs
- codegen.config.cjs
- codegen.json
- codegen.yaml
- codegen.yml
- codegen.js
- codegen.ts
- codegen.mjs
- codegen.cjs

