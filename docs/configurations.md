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

## TypeScript Configuration

When generating TypeScript code, you can configure global options that apply to all generators. These options can be overridden per-generator if needed.

### Import Extensions (node16/nodenext/verbatimModuleSyntax)

Modern TypeScript projects using strict ESM settings (`moduleResolution: "node16"` or `"nodenext"`, or `verbatimModuleSyntax: true`) require explicit file extensions in import statements. Use the `importExtension` option to configure this:

```javascript
// codegen.config.mjs
export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.json',
  language: 'typescript',
  importExtension: '.ts',  // Required for moduleResolution: "node16"

  generators: [
    { preset: 'payloads', outputPath: './src/payloads' },
    { preset: 'channels', outputPath: './src/channels', protocols: ['nats'] }
  ]
};
```

#### Import Extension Options

| Value | When to Use | tsconfig Settings |
|-------|-------------|-------------------|
| `"none"` (default) | Bundlers (webpack, vite) or classic Node.js | `moduleResolution: "node"` or `"bundler"` |
| `".ts"` | Modern ESM with TypeScript sources | `moduleResolution: "node16"/"nodenext"` + `allowImportingTsExtensions: true` |
| `".js"` | Compiled ESM output | `moduleResolution: "node16"/"nodenext"` (without `allowImportingTsExtensions`) |

#### Automatic Detection

When `importExtension` is not explicitly set in your configuration, the codegen automatically detects the appropriate setting based on your project setup. This enables zero-configuration support for most projects.

**Detection priority:**

1. **Bundler config files** (`vite.config.ts`, `webpack.config.js`, `next.config.js`, etc.) → `"none"`
2. **Bundler in dependencies** (vite, webpack, esbuild, rollup, parcel) → `"none"`
3. **`moduleResolution: "bundler"`** in tsconfig.json → `"none"`
4. **`moduleResolution: "node16"/"nodenext"` + `allowImportingTsExtensions: true`** → `".ts"`
5. **`moduleResolution: "node16"/"nodenext"`** (without allowImportingTsExtensions) → `".js"`
6. **Otherwise** → Uses default (`"none"`)

When detection occurs, you'll see an info message:
```
Auto-detected importExtension: '.js'
```

**Note:** You can always override automatic detection by explicitly setting `importExtension` in your configuration.

**Limitation:** Automatic detection only affects `channels` and `client` generators. The `payloads`, `parameters`, `headers`, and `models` generators use Modelina which doesn't currently support import extensions.

#### Per-Generator Override

You can override the global setting for individual generators:

```javascript
export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.json',
  language: 'typescript',
  importExtension: '.ts',  // Global default
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' },  // Uses global .ts
    { preset: 'channels', outputPath: './src/channels', importExtension: 'none' }  // Override
  ]
};
```
