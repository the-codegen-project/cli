const path = require('path');
const { cp, readFile, writeFile } = require('fs/promises');
const DOCS_ROOT_PATH = path.join(__dirname, '../../docs');
const DOCS_DOCU_PATH = path.join(__dirname, '../docs');

const ASSETS_ROOT_PATH = path.join(__dirname, '../../assets');
const ASSETS_DOCU_PATH = path.join(__dirname, '../static/assets');

/**
 * The plain list of presets in `docs/generators/README.md`.
 *
 * The docs also have to render on GitHub, so the repo copy stays plain markdown
 * with no imports or JSX. On the website we swap that list for the same preset
 * card grid the landing page uses - `<GeneratorCards />` is registered globally
 * in `src/theme/MDXComponents.tsx`, so the injected tag needs no import.
 */
const GENERATOR_LIST_PATTERN =
  /^All available generators, across languages and inputs:\r?\n(?:- \[`[a-z]+`\]\([^)]+\)\r?\n)+/m;

async function replaceGeneratorList() {
  const readmePath = path.join(DOCS_DOCU_PATH, 'generators/README.md');
  const content = await readFile(readmePath, 'utf-8');

  if (!GENERATOR_LIST_PATTERN.test(content)) {
    throw new Error(
      `Could not find the generator list in ${readmePath} to replace with <GeneratorCards />. ` +
        'If the wording of that list changed, update GENERATOR_LIST_PATTERN in website/scripts/move_docs.js.'
    );
  }

  await writeFile(
    readmePath,
    content.replace(GENERATOR_LIST_PATTERN, '<GeneratorCards />\n')
  );
}

async function main() {
  await Promise.all([
    cp(DOCS_ROOT_PATH, DOCS_DOCU_PATH, { recursive: true }),
    cp(ASSETS_ROOT_PATH, ASSETS_DOCU_PATH, { recursive: true }),
  ]);
  await replaceGeneratorList();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
