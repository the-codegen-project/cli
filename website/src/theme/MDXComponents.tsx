import MDXComponents from '@theme-original/MDXComponents';
import GeneratorCards from '@site/src/components/GeneratorCards';

/**
 * Components usable from any doc without an `import` line.
 *
 * The docs are copied in from the repo root, where they also have to render on
 * GitHub - so nothing in them may carry an import statement. Registering here
 * lets `scripts/move_docs.js` inject a bare `<GeneratorCards />` tag instead.
 */
export default {
  ...MDXComponents,
  GeneratorCards
};
