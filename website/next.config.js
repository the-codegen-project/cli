const MCP_URL = "https://the-codegen-project-pc9xv8h9a-jonas-lagonis-projects.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/mcp",
        destination: `${MCP_URL}/api/mcp`,
      }
    ];
  },
};

module.exports = nextConfig;