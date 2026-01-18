/**
 * Script to bundle documentation files from ../docs/ into a TypeScript module.
 * Run with: npx tsx scripts/bundle-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = path.join(__dirname, '../../docs');
const OUTPUT_FILE = path.join(__dirname, '../lib/resources/bundled-docs.ts');

interface DocEntry {
  key: string;
  content: string;
  title: string;
}

/**
 * Remove frontmatter from markdown content
 */
function stripFrontmatter(content: string): string {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
  return content.replace(frontmatterRegex, '').trim();
}

/**
 * Extract title from markdown content (first # heading)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string, basePath: string = ''): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Convert file path to resource key
 * e.g., "generators/payloads.md" -> "generators/payloads"
 *       "README.md" -> "index"
 *       "getting-started/README.md" -> "getting-started"
 */
function filePathToKey(filePath: string): string {
  let key = filePath.replace(/\.md$/, '');

  // Handle README files - they become the index of their directory
  if (key.endsWith('/README')) {
    key = key.replace('/README', '') || 'index';
  } else if (key === 'README') {
    key = 'index';
  }

  return key;
}

/**
 * Main bundling function
 */
function bundleDocs(): void {
  console.log('Bundling documentation from:', DOCS_DIR);

  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  console.log(`Found ${markdownFiles.length} markdown files`);

  const docs: DocEntry[] = [];

  for (const file of markdownFiles) {
    const fullPath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const strippedContent = stripFrontmatter(content);
    const title = extractTitle(strippedContent);
    const key = filePathToKey(file);

    docs.push({
      key,
      content: strippedContent,
      title,
    });

    console.log(`  - ${file} -> ${key}`);
  }

  // Generate the TypeScript file
  const output = `/**
 * Auto-generated documentation bundle.
 * DO NOT EDIT - regenerate with: npm run bundle-docs
 * Generated at: ${new Date().toISOString()}
 */

export interface DocEntry {
  content: string;
  title: string;
}

export const docs: Record<string, DocEntry> = {
${docs.map(doc => `  ${JSON.stringify(doc.key)}: {
    title: ${JSON.stringify(doc.title)},
    content: ${JSON.stringify(doc.content)},
  }`).join(',\n')}
};

/**
 * Get all available documentation keys
 */
export function getDocKeys(): string[] {
  return Object.keys(docs);
}

/**
 * Get documentation by key
 */
export function getDoc(key: string): DocEntry | undefined {
  return docs[key];
}

/**
 * Get all documentation entries
 */
export function getAllDocs(): Array<{ key: string } & DocEntry> {
  return Object.entries(docs).map(([key, entry]) => ({
    key,
    ...entry,
  }));
}

/**
 * Search documentation by keyword
 */
export function searchDocs(query: string): Array<{ key: string } & DocEntry> {
  const lowerQuery = query.toLowerCase();
  return getAllDocs().filter(
    doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
  );
}
`;

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nGenerated: ${OUTPUT_FILE}`);
  console.log(`Total docs bundled: ${docs.length}`);
}

// Run the bundler
bundleDocs();
