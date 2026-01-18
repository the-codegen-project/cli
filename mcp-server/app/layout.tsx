import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'The Codegen Project - MCP Server',
  description:
    'Model Context Protocol server for The Codegen Project. Helps AI assistants create configurations and integrate generated code.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
