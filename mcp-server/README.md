# The Codegen Project - MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [The Codegen Project](https://github.com/the-codegen-project/cli). This server helps AI assistants create and manage codegen configurations and integrate generated code into projects.

## Features

### Tools

**Configuration Tools:**
- `create_config` - Create a new codegen configuration file
- `add_generator` - Generate configuration for adding a single generator
- `list_generators` - List available generators and their options
- `validate_config` - Validate a configuration object

**Integration Tools:**
- `get_usage_example` - Get code examples for using generated code
- `get_imports` - Generate TypeScript import statements

### Resources

Documentation from The Codegen Project is exposed as MCP resources:
- `codegen://docs` - List all available documentation
- `codegen://docs/configurations` - Configuration guide
- `codegen://docs/generators/{name}` - Generator-specific documentation
- `codegen://docs/protocols/{name}` - Protocol documentation
- `codegen://docs/inputs/{name}` - Input type documentation

### Prompts

- `codegen-guidelines` - Guidelines for AI assistants working with generated code (e.g., never edit generated files, how to modify output, regeneration workflow)

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Bundle documentation from ../docs/
npm run bundle-docs

# Start development server
npm run dev
```

The server will be available at `http://localhost:3000`.

### Testing with MCP Inspector

1. Run the MCP inspector:
   ```bash
   pnpm dlx @modelcontextprotocol/inspector@latest http://localhost:3000 undefined
   ```

2. Open `http://127.0.0.1:6274`

3. Connect to your local server:
   - Select "Streamable HTTP"
   - URL: `http://localhost:3000/api/mcp`
   - Click "Connect"

4. Test tools and resources in the inspector interface.

### Connecting from AI Assistants

**Cursor:**

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "codegen": {
      "url": "https://your-vercel-url.vercel.app/api/mcp"
    }
  }
}
```

**Claude Code:**

Add to `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "codegen": {
      "url": "https://your-vercel-url.vercel.app/api/mcp"
    }
  }
}
```
