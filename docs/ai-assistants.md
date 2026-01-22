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

## Q&A

### Q: If AI can generate code, why use The Codegen Project?
The generator gives you deterministic, repeatable output from a stable input (spec + config). That makes CI consistent, supports large-team conventions, and lets you regenerate code without drift across runs or models.

### Q: Won’t AI output be maintained by developers anyway?
Yes, but generators keep a traceable “source of truth” in the configuration. That means you can explain why code exists, regenerate it reliably, and keep updates consistent across many services.

### Q: When should I prefer AI over a generator?
Use AI for exploration, prototypes, or one-off scripts. Use the generator when you want consistent output, shared conventions, automated regeneration.

### Q: Does this project compete with AI assistants?
It complements them. The MCP server gives assistants a deterministic interface to create and adjust configs, while the generator produces the exact code your repo expects.

### Q: What’s the biggest advantage over “just using AI”?
Repeatability. The same input produces the same output every time, which is critical for CI, refactors, and multi-team consistency.
