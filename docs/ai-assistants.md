---
sidebar_position: 11
sidebar_label: AI Assistants
---

# AI Assistants

The Codegen Project provides a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that enables AI assistants to help you create and manage The Codegen Project configurations and interactions. This allows tools like Claude Code, Cursor, Windsurf, and other MCP-compatible assistants to understand The Codegen Project and assist you more effectively.

## Why Use the MCP Server?

When connected to an AI assistant, the MCP server provides:

- **Configuration Creation**: AI can generate complete codegen configuration files based on your requirements
- **Configuration Adaption**: AI can help adapt your codegen configuration based on your requirements
- **Interacting with generated code**: Can help inject the right context for interacting with the generated code
- **Documentation Access**: AI has direct access to all project documentation.

## Quick Setup

### Claude Code

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "the-codegen-project": {
      "url": "https://the-codegen-project.org/api/mcp"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "the-codegen-project": {
      "url": "https://the-codegen-project.org/api/mcp"
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "the-codegen-project": {
      "url": "https://the-codegen-project.org/api/mcp"
    }
  }
}
```

### Other MCP-Compatible Tools

Any tool that supports the Model Context Protocol can connect using the URL:

```
https://the-codegen-project.org/api/mcp
```

## Self-Hosting

You can run your own instance of the MCP server for development or private use. See the [MCP server repository](https://github.com/the-codegen-project/cli/tree/main/mcp-server) for setup instructions.
