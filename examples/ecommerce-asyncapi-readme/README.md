# README generator example

Shows how the [`readme`](../../docs/generators/readme-generator.md) generator produces an install-and-usage `README.md` for a generated SDK, with usage sections derived from the other configured generators.

**Files:**
- `user-events.yaml` - AsyncAPI specification with a single user-signup event
- `codegen.config.js` - Configuration generating payloads, NATS channels, and a README documenting them
- `src/generated` - All the generated files, including the generated `README.md` at the project root

**What the readme generator does here:**
- Uses `packageName` / `packageVersion` to render the title and `npm` / `yarn` / `pnpm` install commands
- Prepends the `introduction` Markdown above the generated content
- Renders a NATS usage section from the `channels` generator output and a payloads section from the `payloads` generator output — because both IDs are listed in `dependencies`
- Appends a CLI attribution suffix (override it with the `suffix` option)

**Usage:**
```bash
# Install dependencies
npm install

# Generate
npx @the-codegen-project/cli generate
```
