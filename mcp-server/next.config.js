const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Specify this project as the root to avoid conflicts with parent lockfile
  outputFileTracingRoot: path.join(__dirname),
  // Disable eslint during build (we run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
