export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
      }}
    >
      <h1>The Codegen Project - MCP Server</h1>

      <p>
        This is a{' '}
        <a
          href="https://modelcontextprotocol.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Model Context Protocol (MCP)
        </a>{' '}
        server for{' '}
        <a
          href="https://github.com/the-codegen-project/cli"
          target="_blank"
          rel="noopener noreferrer"
        >
          The Codegen Project
        </a>
        .
      </p>

      <h2>Available Tools</h2>

      <h3>Configuration Tools</h3>
      <ul>
        <li>
          <strong>create_config</strong> - Create a new codegen configuration
          file
        </li>
        <li>
          <strong>add_generator</strong> - Generate configuration for a single
          generator
        </li>
        <li>
          <strong>list_generators</strong> - List available generators and their
          options
        </li>
        <li>
          <strong>validate_config</strong> - Validate a configuration object
        </li>
      </ul>

      <h3>Integration Tools</h3>
      <ul>
        <li>
          <strong>get_usage_example</strong> - Get code examples for generated
          code
        </li>
        <li>
          <strong>get_imports</strong> - Generate import statements
        </li>
      </ul>

      <h2>Resources</h2>
      <p>
        Documentation from The Codegen Project is available as MCP resources:
      </p>
      <ul>
        <li>
          <code>codegen://docs</code> - List all documentation
        </li>
        <li>
          <code>codegen://docs/configurations</code> - Configuration guide
        </li>
        <li>
          <code>codegen://docs/generators/*</code> - Generator documentation
        </li>
        <li>
          <code>codegen://docs/protocols/*</code> - Protocol documentation
        </li>
        <li>
          <code>codegen://docs/inputs/*</code> - Input type documentation
        </li>
      </ul>

      <h2>Connecting</h2>

      <h3>Cursor</h3>
      <p>
        Add to your <code>.cursor/mcp.json</code>:
      </p>
      <pre
        style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {JSON.stringify(
          {
            mcpServers: {
              codegen: {
                url: 'https://YOUR_VERCEL_URL/api/mcp',
              },
            },
          },
          null,
          2
        )}
      </pre>

      <h3>Claude Code</h3>
      <p>
        Add to your <code>~/.claude/mcp.json</code>:
      </p>
      <pre
        style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {JSON.stringify(
          {
            mcpServers: {
              codegen: {
                url: 'https://YOUR_VERCEL_URL/api/mcp',
              },
            },
          },
          null,
          2
        )}
      </pre>

      <h2>Links</h2>
      <ul>
        <li>
          <a
            href="https://github.com/the-codegen-project/cli"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Codegen Project on GitHub
          </a>
        </li>
        <li>
          <a
            href="https://modelcontextprotocol.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Model Context Protocol
          </a>
        </li>
      </ul>
    </main>
  );
}
