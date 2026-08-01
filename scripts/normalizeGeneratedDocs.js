/**
 * Makes `npm run generate:assets` idempotent for the markdown docs it rewrites.
 *
 * Two upstream tools leave non-deterministic output behind:
 *
 * 1. `markdown-toc -i` appends one blank line every time it actually rewrites a
 *    file, so each release grew docs/README.md, docs/contributing.md and
 *    docs/migrations/v0.md by one trailing newline.
 * 2. `oclif readme` renders the sample `codegen --version` output using the
 *    platform and Node.js version of whoever ran it, so the line flipped
 *    between machines (and between Node.js patch releases on CI).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

/** Files rewritten by `generate:readme:toc` / `generate:commands`. */
const docs = [
  'README.md',
  'docs/usage.md',
  'docs/README.md',
  'docs/contributing.md',
  'docs/migrations/v0.md'
];

/** `@the-codegen-project/cli/1.2.3 darwin-arm64 node-v24.15.0` */
const versionSample = /^(@the-codegen-project\/cli\/\S+) \S+ node-\S+$/m;
const versionSampleReplacement = '$1 <platform> node-<version>';

const changed = [];

for (const relativePath of docs) {
  const filePath = path.join(repoRoot, relativePath);
  const original = fs.readFileSync(filePath, 'utf8');

  let normalized = `${original.replace(/\s+$/, '')}\n`;
  if (relativePath === 'docs/usage.md') {
    normalized = normalized.replace(versionSample, versionSampleReplacement);
  }

  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized);
    changed.push(relativePath);
  }
}

console.log(
  changed.length > 0
    ? `Normalized:\n  ${changed.join('\n  ')}`
    : 'Normalized: no changes needed'
);
