/**
 * Playground page - Interactive code generator.
 *
 * The actual implementation lives in `PlaygroundContent` and is loaded
 * exclusively on the client via `BrowserOnly`. Monaco Editor and the browser
 * codegen bundle access `window` during module init, so they cannot be
 * imported during Docusaurus's SSR pass.
 */

import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function PlaygroundPage(): JSX.Element {
  return (
    <Layout
      title="Playground"
      description="Interactive code generator - Try The Codegen Project in your browser"
    >
      <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Loading playground...</div>}>
        {() => {
          // Only required on the client to avoid SSR-time `window` references.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
          const PlaygroundContent = require('../../components/Playground/PlaygroundContent').default;
          return <PlaygroundContent />;
        }}
      </BrowserOnly>
    </Layout>
  );
}
